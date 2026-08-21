import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const resendSchema = z.object({
  adminEmail: z.string().email(),
  adminPassword: z.string(),
  customerEmail: z.string().email(),
});

/**
 * Versão simplificada para garantir o registro no TanStack Start
 */
export const adminResendWelcomeEmailFinal = createServerFn({ method: "POST" })
  .validator((data: any) => resendSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const { isAdminCredentials } = await import("./settings.server");
      const { listSignups } = await import("./signups-repo.server");
      const { sendTransactionalEmail } = await import("./transactional-emails.functions");

      if (!isAdminCredentials(data.adminEmail, data.adminPassword)) {
        throw new Error("Não autorizado.");
      }

      const signups = await listSignups();
      const lead = signups.find((s: any) => s.email.toLowerCase() === data.customerEmail.toLowerCase());

      if (!lead) {
        return { success: false, error: "Cadastro não encontrado." };
      }

      return await sendTransactionalEmail({
        data: {
          type: "welcome",
          name: lead.name,
          email: lead.email,
          password: "",
          orderNsu: `manual:${Date.now()}`
        }
      });
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });