import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sendTransactionalEmail } from "./transactional-emails.functions";
import { listSignups } from "./signups-repo.server";
import { isAdminPassword } from "./orders-repo.server";

export const adminResendWelcomeEmail = createServerFn({ method: "POST" })
  .validator((data: any) =>
    z.object({
      adminPassword: z.string(),
      customerEmail: z.string().email(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    if (!isAdminPassword(data.adminPassword)) {
      throw new Error("Não autorizado");
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
