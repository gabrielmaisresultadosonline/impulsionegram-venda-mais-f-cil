import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { saveEmailLog } from "./email-followup/logs-repo.server";

// Schema centralizado
export const transactionalEmailSchema = z.object({
  type: z.string(), // "welcome", "payment_confirmed", "delivered", "followup_*"
  email: z.string().email(),
  name: z.string(),
  password: z.string().optional(),
  orderNsu: z.string().optional(),
  planName: z.string().optional(),
  receiptUrl: z.string().optional(),
});

export type TransactionalEmailData = z.infer<typeof transactionalEmailSchema>;

/**
 * Função INTERNA (server-only) que realiza o envio SMTP real.
 * NÃO é uma Server Function do TanStack.
 * Pode ser chamada diretamente de outros códigos no servidor.
 */
export async function sendTransactionalEmailInternal(data: TransactionalEmailData) {
  const user = process.env["SMTP_USER"];
  const pass = process.env["SMTP_PASS"];

  console.log(`[EMAIL] início envio para: ${data.email} (tipo: ${data.type})`);

  if (!user || !pass) {
    console.error("[EMAIL] SMTP configurado: NÃO (credenciais ausentes)");
    return { success: false, error: "Servidor SMTP não configurado (env)." };
  }

  console.log("[EMAIL] SMTP configurado: SIM");

  try {
    const nodemailer = await import("nodemailer");
    console.log("[EMAIL] conectando SMTP (smtp.hostinger.com:465)");
    
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: { user, pass },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });

    const firstName = data.name.split(" ")[0];
    let subject = "";
    let html = "";

    if (data.type === "welcome") {
      subject = `Bem-vindo à Acessar Click, ${firstName}! 🚀`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #eeeeee;">
          <div style="background-color: #000000; padding: 30px; text-align: center;">
            <h1 style="color: #00f2fe; margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px;">Acessar Click</h1>
            <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px;">Parceiro Oficial de Crescimento Meta</p>
          </div>
          
          <div style="padding: 40px 30px; line-height: 1.6; color: #333333;">
            <h2 style="color: #000000; margin-top: 0;">Olá, ${firstName}! 👋</h2>
            <p>Sua conta foi criada com sucesso na <strong>Acessar Click</strong>.</p>
            
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #00f2fe;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #000000;">Dados de Acesso:</p>
              <p style="margin: 5px 0;"><strong>Painel:</strong> <a href="https://acessar.click/painel">https://acessar.click/painel</a></p>
              <p style="margin: 5px 0;"><strong>E-mail:</strong> ${data.email}</p>
              ${data.password ? `<p style="margin: 5px 0;"><strong>Senha:</strong> ${data.password}</p>` : `
                <p style="margin: 15px 0 5px 0; font-size: 12px; color: #666;">
                  Caso não lembre sua senha, utilize o link de recuperação abaixo:
                </p>
                <p style="margin: 5px 0;"><a href="https://acessar.click/recuperar">Recuperar Senha</a></p>
              `}
            </div>
          </div>
          
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #666666;">
            <p style="margin: 0;">&copy; 2026 Acessar Click - Inteligência Artificial para Instagram</p>
          </div>
        </div>
      `;
    } else if (data.type === "payment_confirmed") {
      subject = `Pagamento Confirmado! Sua I.A começou a trabalhar ⚡`;
      html = `<div style="padding: 20px; background: #000; color: #fff;"><h1>Aprovado!</h1><p>Seu plano ${data.planName} está ativo.</p></div>`;
    } else if (data.type === "delivered") {
      subject = `Serviço Entregue com Sucesso! ✅`;
      html = `<div style="padding: 20px; background: #000; color: #fff;"><h1>Concluído!</h1><p>Sua campanha foi finalizada.</p></div>`;
    } else if (data.type.startsWith("followup_")) {
      const { FOLLOWUPS } = await import("./email-followup/engine.server");
      const followup = FOLLOWUPS.find(f => f.type === data.type);
      if (followup) {
        subject = followup.subject;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6;">
            <h2 style="color: #00f2fe; background-color: #000; padding: 10px; text-align: center;">Olá, ${firstName}!</h2>
            ${followup.template(data.name).replace(/\n/g, '<br>')}
            <br><br>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center;">
              &copy; 2026 Acessar Click - Inteligência Artificial para Instagram<br>
              Você recebeu este e-mail porque se cadastrou em acessar.click
            </div>
          </div>
        `;
      }
    }

    console.log("[EMAIL] enviando mensagem...");
    await transporter.sendMail({
      from: `"Acessar Click" <${user}>`,
      to: data.email,
      subject,
      html,
    });

    console.log("[EMAIL] SMTP enviado com sucesso");

    // Salva log no Supabase
    await saveEmailLog({
      orderNsu: data.orderNsu || "transactional",
      customerEmail: data.email,
      customerName: data.name,
      type: data.type as any,
      subject,
      content: `ENVIADO: ${subject}`,
    });

    return { success: true };
  } catch (error: any) {
    console.error("[EMAIL] erro SMTP:", error.message || String(error));
    
    // Fallback de log de erro no Supabase
    await saveEmailLog({
      orderNsu: data.orderNsu || "failed",
      customerEmail: data.email,
      customerName: data.name,
      type: data.type as any,
      subject: `[FALHA] ${data.type}`,
      content: `ERRO SMTP: ${error.message || String(error)}`,
    });

    return { success: false, error: error.message || "Erro no transporte SMTP" };
  }
}

/**
 * Server Function pública para chamadas do CLIENTE.
 * É apenas um wrapper da função interna.
 */
export const sendTransactionalEmail = createServerFn({ method: "POST" })
  .validator((data: any) => transactionalEmailSchema.parse(data))
  .handler(async ({ data }) => {
    return await sendTransactionalEmailInternal(data);
  });