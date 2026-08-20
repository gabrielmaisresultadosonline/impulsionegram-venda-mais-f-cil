import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sendTransactionalEmail } from "./transactional-emails.functions";
import { listSignups } from "./signups-repo.server";
import { isAdminCredentials } from "./settings.server";

export const adminResendWelcomeEmail = createServerFn({ method: "POST" })
  .validator((data: any) =>
    z.object({
      adminEmail: z.string().email(),
      adminPassword: z.string(),
      customerEmail: z.string().email(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    // Usamos a mesma função de validação de login do admin para garantir consistência
    if (!isAdminCredentials(data.adminEmail, data.adminPassword)) {
      throw new Error("Não autorizado: credenciais de administrador inválidas.");
    }

    const signups = listSignups();
    const lead = signups.find(s => s.email.toLowerCase() === data.customerEmail.toLowerCase());

    if (!lead) {
      return { success: false, error: "Cadastro não encontrado." };
    }

    try {
      const result = await sendTransactionalEmail({
        data: {
          type: "welcome",
          name: lead.name,
          email: lead.email,
          orderNsu: `manual-welcome:${Date.now()}`
        }
      });

      return { success: result.success, error: result.error };
    } catch (err) {
      console.error("[adminResendWelcomeEmail] Erro ao reenviar e-mail:", err);
      return { success: false, error: String(err) };
    }
  });
