import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { saveEmailLog } from "./email-followup/logs-repo.server";

/**
 * Função de servidor para enviar o e-mail de boas-vindas.
 * Nota: Devido a restrições de ambiente edge, o nodemailer deve ser importado dinamicamente
 * ou usado em um ambiente que suporte nodejs_compat.
 */
export const sendWelcomeEmail = createServerFn({ method: "POST" })
  .validator((data) =>
    z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string().optional(),
      orderNsu: z.string().optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { sendTransactionalEmailInternal } = await import("./transactional-emails.functions");
    return await sendTransactionalEmailInternal({
      type: "welcome",
      email: data.email,
      name: data.name,
      password: data.password,
      orderNsu: data.orderNsu,
    });
  });

export const sendPasswordRecoveryEmail = createServerFn({ method: "POST" })
  .validator((data) =>
    z.object({
      email: z.string().email(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { email } = data;
    const { listSignups } = await import("./signups-repo.server");
    const signups = await listSignups();
    const account = signups.find((s: any) => s.email.toLowerCase() === email.toLowerCase());

    if (!account) return { success: false, error: "NOT_FOUND" };

    const { sendTransactionalEmailInternal } = await import("./transactional-emails.functions");
    
    return await sendTransactionalEmailInternal({
      type: "password_recovery",
      email: data.email,
      name: account.name,
    });
  });
