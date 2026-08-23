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

    const logoUrl = "https://5306062e-dd22-4505-a2c3-baf689a08983.lovableproject.com/__l5e/assets-v1/3b3c5073-9d32-4c16-b79c-1bd3a4b9b8df/logo-acessar-click.png";
    const primaryColor = "#ff00d4"; // Magenta Neon aprox (oklch(0.6 0.24 350))
    const successColor = "#00ffa6"; // Verde Esmeralda aprox (oklch(0.62 0.16 155))
    const textColor = "#0a0a29"; // Azul muito escuro (oklch(0.22 0.02 300))
    const brandGradient = "linear-gradient(100deg, #ff00d4 0%, #ff5c33 55%, #ffcc33 100%)";

    const baseStyle = `
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      color: ${textColor};
      border: 1px solid #f0f0f0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    `;

    const headerStyle = `
      background-color: #000000;
      padding: 30px;
      text-align: center;
    `;

    const contentStyle = `
      padding: 40px 30px;
      line-height: 1.6;
    `;

    const buttonStyle = `
      display: inline-block;
      padding: 14px 28px;
      background: ${brandGradient};
      color: #ffffff;
      text-decoration: none;
      border-radius: 12px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 20px 0;
    `;

    const footerStyle = `
      background-color: #f9f9fb;
      padding: 25px;
      text-align: center;
      font-size: 12px;
      color: #888899;
    `;

    if (data.type === "welcome") {
      subject = `Bem-vindo à Acessar Click, ${firstName}! 🚀`;
      html = `
        <div style="${baseStyle}">
          <div style="${headerStyle}">
            <img src="${logoUrl}" alt="Acessar Click" style="height: 45px; width: auto;" />
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 13px; letter-spacing: 1px; opacity: 0.8;">Parceiro Oficial Meta Business</p>
          </div>
          
          <div style="${contentStyle}">
            <h2 style="color: ${textColor}; margin-top: 0; font-size: 24px;">Olá, ${firstName}! 👋</h2>
            <p>Sua conta foi criada com sucesso na <strong>Acessar Click</strong>.</p>
            <p>Eu sou sua nova inteligência artificial. Já estou pronta para ajudar o seu perfil a alcançar resultados extraordinários com alcance real, público de concorrentes e engajamento filtrado.</p>
            
            <div style="background-color: #fdf2f8; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 5px solid ${primaryColor};">
              <p style="margin: 0 0 15px 0; font-weight: bold; color: ${textColor}; font-size: 16px;">Seus Dados de Acesso:</p>
              <table width="100%" border="0" cellspacing="0" cellpadding="5">
                <tr><td width="80" style="color: #666;">Painel:</td><td><a href="https://acessar.click/painel" style="color: ${primaryColor}; font-weight: bold;">acessar.click/painel</a></td></tr>
                <tr><td style="color: #666;">E-mail:</td><td style="font-weight: bold;">${data.email}</td></tr>
                ${data.password ? `<tr><td style="color: #666;">Senha:</td><td style="font-weight: bold; color: #333; letter-spacing: 1px;">${data.password}</td></tr>` : ""}
              </table>
              ${!data.password ? `
                <p style="margin: 20px 0 0 0; font-size: 13px; color: #666;">
                  Esqueceu a senha? <a href="https://acessar.click/recuperar" style="color: ${primaryColor};">Recuperar aqui</a>
                </p>
              ` : ""}
            </div>

            <div style="text-align: center;">
              <a href="https://acessar.click/painel" style="${buttonStyle}">Acessar Meu Painel</a>
            </div>
          </div>
          
          <div style="${footerStyle}">
            <p style="margin: 0;">&copy; 2026 Acessar Click - Inteligência Artificial para Instagram</p>
            <p style="margin: 5px 0 0 0; opacity: 0.7;">Você está recebendo este e-mail por ter se cadastrado em nossa plataforma.</p>
          </div>
        </div>
      `;
    } else if (data.type === "payment_confirmed") {
      subject = `Pagamento Confirmado! Sua I.A começou a trabalhar ⚡`;
      html = `
        <div style="${baseStyle}">
          <div style="${headerStyle}">
            <img src="${logoUrl}" alt="Acessar Click" style="height: 45px; width: auto;" />
          </div>
          <div style="${contentStyle}; text-align: center;">
            <div style="font-size: 50px; margin-bottom: 20px;">✅</div>
            <h1 style="color: ${successColor}; margin: 0; font-size: 26px;">Pagamento Aprovado!</h1>
            <p style="font-size: 16px; margin-top: 15px;">Seu plano <strong>${data.planName || "Selecionado"}</strong> já está ativo.</p>
            <p>Nossa equipe e a I.A já iniciaram os processos de alcance e engajamento filtrado para o seu perfil, focando no público real dos seus concorrentes.</p>
            <a href="https://acessar.click/painel" style="${buttonStyle}">Ver Acompanhamento</a>
          </div>
          <div style="${footerStyle}">
            <p>&copy; 2026 Acessar Click</p>
          </div>
        </div>
      `;
    } else if (data.type === "delivered") {
      subject = `Serviço Entregue com Sucesso! ✅`;
      html = `
        <div style="${baseStyle}">
          <div style="${headerStyle}">
            <img src="${logoUrl}" alt="Acessar Click" style="height: 45px; width: auto;" />
          </div>
          <div style="${contentStyle}; text-align: center;">
            <div style="font-size: 50px; margin-bottom: 20px;">🏆</div>
            <h1 style="color: ${textColor}; margin: 0; font-size: 26px;">Resultados Entregues!</h1>
            <p style="font-size: 16px; margin-top: 15px;">Concluímos com sucesso a entrega do seu pedido de alcance e engajamento filtrado.</p>
            <p>Esperamos que os resultados tragam muito crescimento para o seu negócio.</p>
            <a href="https://acessar.click/painel" style="${buttonStyle}">Ver Relatório Final</a>
          </div>
          <div style="${footerStyle}">
            <p>&copy; 2026 Acessar Click</p>
          </div>
        </div>
      `;
    } else if (data.type.startsWith("followup_")) {
      const engine = await import("./email-followup/engine.server");
      const followup = (engine as any).FOLLOWUPS?.find((f: any) => f.type === data.type);
      
      if (followup) {
        subject = followup.subject;
        html = `
          <div style="${baseStyle}">
            <div style="${headerStyle}">
              <img src="${logoUrl}" alt="Acessar Click" style="height: 45px; width: auto;" />
            </div>
            <div style="${contentStyle}">
              <h2 style="color: ${textColor}; margin-top: 0;">Olá, ${firstName}! 👋</h2>
              <div style="font-size: 16px; color: ${textColor};">
                ${followup.template(data.name).replace(/\n/g, '<br>')}
              </div>
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://acessar.click/painel" style="${buttonStyle}">Ativar Minha I.A</a>
              </div>
            </div>
            <div style="${footerStyle}">
              <p>&copy; 2026 Acessar Click</p>
              <p style="opacity: 0.6;">Você recebeu este e-mail porque iniciou um cadastro em acessar.click</p>
            </div>
          </div>
        `;
      }
    } else if (data.type === "password_recovery") {
      subject = "Recuperação de Acesso - Acessar Click";
      html = `
        <div style="${baseStyle}">
          <div style="${headerStyle}">
            <img src="${logoUrl}" alt="Acessar Click" style="height: 45px; width: auto;" />
          </div>
          <div style="${contentStyle}">
            <h2 style="color: ${textColor}; margin-top: 0;">Olá, ${firstName}! 👋</h2>
            <p>Recebemos uma solicitação para recuperar o acesso à sua conta.</p>
            <p>Como suas informações são armazenadas de forma segura em nossa nuvem, você pode redefinir sua senha clicando no botão abaixo:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://acessar.click/recuperar?email=${encodeURIComponent(data.email)}" style="${buttonStyle}">Redefinir Senha</a>
            </div>
            <p style="font-size: 13px; color: #666;">Se você não solicitou isso, pode ignorar este e-mail com segurança.</p>
          </div>
          <div style="${footerStyle}">
            <p>&copy; 2026 Acessar Click</p>
          </div>
        </div>
      `;
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