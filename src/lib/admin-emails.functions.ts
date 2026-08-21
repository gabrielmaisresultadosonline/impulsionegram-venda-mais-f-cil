import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const resendSchema = z.object({
  adminEmail: z.string().email(),
  adminPassword: z.string(),
  customerEmail: z.string().email(),
});

/**
 * Nova localização da função de reenvio para forçar a atualização do manifest
 * e resolver o erro "Server function info not found".
 */
export const adminResendWelcomeEmailV2 = createServerFn({ method: "POST" })
  .validator((data: any) => resendSchema.parse(data))
  .handler(async ({ data }) => {
    console.log(`[adminResendWelcomeEmail] Reenvio solicitado para: ${data.customerEmail}`);
    
    try {
      const { isAdminCredentials } = await import("./settings.server");
      const { listSignups } = await import("./signups-repo.server");
      const { sendTransactionalEmail } = await import("./transactional-emails.functions");

      // 1. Validação de segurança no servidor
      if (!isAdminCredentials(data.adminEmail, data.adminPassword)) {
        console.warn(`[adminResendWelcomeEmail] Não autorizado: ${data.adminEmail}`);
        throw new Error("Não autorizado.");
      }

      // 2. Busca o cadastro
      const signups = await listSignups();
      const lead = signups.find((s: any) => s.email.toLowerCase() === data.customerEmail.toLowerCase());

      if (!lead) {
        return { success: false, error: "Cadastro não encontrado no servidor." };
      }

      // 3. Executa o envio transacional
      const result = await sendTransactionalEmail({
        data: {
          type: "welcome",
          name: lead.name,
          email: lead.email,
          password: "", // Senha não exposta no reenvio manual por segurança
          orderNsu: `manual-welcome:${Date.now()}`
        }
      });

      return { success: result.success, error: result.error };
    } catch (err: any) {
      console.error("[adminResendWelcomeEmail] Erro:", err);
      return { success: false, error: `Erro no servidor: ${err.message}` };
    }
  });