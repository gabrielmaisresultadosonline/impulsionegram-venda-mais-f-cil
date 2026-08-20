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
        subject = `Bem-vindo à Acessar I.A, ${firstName}! 🚀`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #0066FF;">Olá, ${firstName}!</h2>
            <p>Seja bem-vindo(a) à <strong>Acessar I.A</strong>. Sua inteligência artificial parceira da Meta.</p>
            ${data.password ? `<p><strong>Dados de acesso:</strong><br>E-mail: ${data.email}<br>Senha: ${data.password}</p>` : ""}
            <p>Acesse seu painel agora para configurar seu crescimento:</p>
            <a href="https://acessar.click/painel" style="display: inline-block; padding: 12px 25px; background: #0066FF; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Acessar Painel</a>
          </div>
        `;
      } else if (data.type === "payment_confirmed") {
        subject = `Pagamento Confirmado! Sua I.A começou a trabalhar ⚡`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #22C55E;">Pagamento Aprovado!</h2>
            <p>Olá, ${firstName}. Confirmamos o pagamento do plano <strong>${data.planName || "Impulsione"}</strong>.</p>
            <p>Nossa I.A já iniciou o processamento do seu pedido (NSU: ${data.orderNsu}).</p>
            <p>Você pode acompanhar o progresso em tempo real no seu painel.</p>
            <a href="https://acessar.click/pedido?order_nsu=${data.orderNsu}" style="display: inline-block; padding: 12px 25px; background: #22C55E; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Ver Status do Pedido</a>
          </div>
        `;
      } else if (data.type === "delivered") {
        subject = `Serviço Entregue com Sucesso! ✅`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #0066FF;">Tudo pronto, ${firstName}!</h2>
            <p>Passando para avisar que sua campanha de <strong>${data.planName || "Instagram"}</strong> foi finalizada e entregue.</p>
            <p>Confira os resultados no seu perfil e, se precisar de mais, nossa I.A está pronta para o próximo nível.</p>
            <p>Obrigado por confiar na Acessar I.A!</p>
            <a href="https://acessar.click/painel" style="display: inline-block; padding: 12px 25px; background: #0066FF; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Novo Pedido</a>
          </div>
        `;
      }

      await transporter.sendMail({
        from: `"Acessar I.A Support" <${user}>`,
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
