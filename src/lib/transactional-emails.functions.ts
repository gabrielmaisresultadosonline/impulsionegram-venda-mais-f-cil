import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { saveEmailLog } from "./email-followup/logs-repo.server";

/**
 * Função centralizada para envio de e-mails transacionais (Boas-vindas, Pagamento, Entrega).
 */
export const sendTransactionalEmail = createServerFn({ method: "POST" })
  .validator((data: any) =>
    z
      .object({
        type: z.enum(["welcome", "payment_confirmed", "delivered"]),
        email: z.string().email(),
        name: z.string(),
        password: z.string().optional(),
        orderNsu: z.string().optional(),
        planName: z.string().optional(),
        receiptUrl: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const user = process.env["SMTP_USER"];
    const pass = process.env["SMTP_PASS"];

    if (!user || !pass) {
      console.error("Configurações de SMTP ausentes");
      return { success: false, error: "SMTP configuration missing" };
    }

    try {
      console.log(`[sendTransactionalEmail] Preparando envio ${data.type} para ${data.email}`);
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: "smtp.hostinger.com",
        port: 465,
        secure: true,
        auth: { user, pass },
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
              <p>Seja muito bem-vindo à <strong>Acessar Click</strong>, sua inteligência artificial especializada em seguidores e engajamento automático para Instagram.</p>
              
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #00f2fe;">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #000000;">Seus Dados de Acesso:</p>
                <p style="margin: 5px 0;"><strong>Usuário/E-mail:</strong> ${data.email}</p>
                ${data.password ? `<p style="margin: 5px 0;"><strong>Senha:</strong> ${data.password}</p>` : ""}
              </div>
              
              <p>Com nossa tecnologia, seu perfil ganhará popularidade real com seguidores filtrados por região e concorrentes de forma 100% automática.</p>
              
              <div style="text-align: center; margin-top: 35px;">
                <a href="https://acessar.click/painel" style="display: inline-block; padding: 15px 35px; background-color: #000000; color: #00f2fe; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; border: 1px solid #00f2fe;">ACESSAR MEU PAINEL AGORA</a>
              </div>
            </div>
            
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #666666;">
              <p style="margin: 0;">&copy; 2026 Acessar Click - Inteligência Artificial para Instagram</p>
              <p style="margin: 5px 0 0 0;">Este é um e-mail transacional referente ao seu cadastro.</p>
            </div>
          </div>
        `;
      } else if (data.type === "payment_confirmed") {
        subject = `Pagamento Confirmado! Sua I.A começou a trabalhar ⚡`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #eeeeee;">
            <div style="background-color: #000000; padding: 30px; text-align: center;">
              <h1 style="color: #00f2fe; margin: 0; font-size: 28px;">Acessar Click</h1>
            </div>
            <div style="padding: 40px 30px; line-height: 1.6; color: #333333;">
              <h2 style="color: #22C55E; margin-top: 0;">Pagamento Aprovado!</h2>
              <p>Olá, ${firstName}. Confirmamos o pagamento do plano <strong>${data.planName || "Impulsione"}</strong>.</p>
              <p>Nossa I.A já iniciou o processamento do seu pedido (NSU: ${data.orderNsu}).</p>
              <div style="text-align: center; margin-top: 35px;">
                <a href="https://acessar.click/pedido?order_nsu=${data.orderNsu}" style="display: inline-block; padding: 15px 35px; background-color: #000000; color: #22C55E; text-decoration: none; border-radius: 5px; font-weight: bold; border: 1px solid #22C55E;">VER STATUS DO PEDIDO</a>
              </div>
            </div>
          </div>
        `;
      } else if (data.type === "delivered") {
        subject = `Serviço Entregue com Sucesso! ✅`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #eeeeee;">
            <div style="background-color: #000000; padding: 30px; text-align: center;">
              <h1 style="color: #00f2fe; margin: 0; font-size: 28px;">Acessar Click</h1>
            </div>
            <div style="padding: 40px 30px; line-height: 1.6; color: #333333;">
              <h2 style="color: #00f2fe; margin-top: 0;">Tudo pronto, ${firstName}!</h2>
              <p>Sua campanha de <strong>${data.planName || "Instagram"}</strong> foi finalizada e entregue com sucesso.</p>
              <p>Confira os resultados no seu perfil e, se precisar de mais, nossa I.A está pronta para o próximo nível.</p>
              <div style="text-align: center; margin-top: 35px;">
                <a href="https://acessar.click/painel" style="display: inline-block; padding: 15px 35px; background-color: #000000; color: #00f2fe; text-decoration: none; border-radius: 5px; font-weight: bold; border: 1px solid #00f2fe;">NOVO PEDIDO</a>
              </div>
            </div>
          </div>
        `;
      }

      await transporter.sendMail({
        from: `"Acessar Click Support" <${user}>`,
        to: data.email,
        subject,
        html,
      });

      console.log(`[sendTransactionalEmail] E-mail ${data.type} enviado com sucesso para ${data.email}`);

      saveEmailLog({
        orderNsu: data.orderNsu || "transactional",
        customerEmail: data.email,
        customerName: data.name,
        type: data.type as any,
        subject,
        content: html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
      });

      return { success: true };
    } catch (error) {
      console.error(`Erro ao enviar e-mail ${data.type}:`, error);
      return { success: false, error: String(error) };
    }
  });
