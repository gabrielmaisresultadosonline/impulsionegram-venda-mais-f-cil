import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { saveEmailLog } from "./email-followup/logs-repo.server";

// Schema simplificado para evitar erros de serialização no TanStack Start
const transactionalEmailSchema = z.object({
  type: z.string(), // "welcome", "payment_confirmed", "delivered"
  email: z.string().email(),
  name: z.string(),
  password: z.string().optional(),
  orderNsu: z.string().optional(),
  planName: z.string().optional(),
  receiptUrl: z.string().optional(),
});

/**
 * Função centralizada para envio de e-mails transacionais.
 * Processada inteiramente no servidor.
 */
export const sendTransactionalEmail = createServerFn({ method: "POST" })
  .validator((data: any) => transactionalEmailSchema.parse(data))
  .handler(async ({ data }) => {
    // Leitura direta das envs dentro do handler
    const user = process.env["SMTP_USER"];
    const pass = process.env["SMTP_PASS"];

    if (!user || !pass) {
      console.error("[SMTP] Credenciais ausentes no servidor.");
      return { success: false, error: "Servidor SMTP não configurado (env)." };
    }

    try {
      // Import dinâmico para garantir execução no servidor (Edge/Worker)
      const nodemailer = await import("nodemailer");
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
                ${data.password ? `<p style="margin: 5px 0;"><strong>Senha:</strong> ${data.password}</p>` : ""}
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
      }

      await transporter.sendMail({
        from: `"Acessar Click" <${user}>`,
        to: data.email,
        subject,
        html,
      });

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
      console.error("[SMTP ERROR]", error);
      
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
  });