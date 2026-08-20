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
    z
      .object({
        name: z.string(),
        email: z.string().email(),
        password: z.string().optional(),
        orderNsu: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const { name, email, password } = data;

    // Lemos do process.env dentro do handler (padrão TanStack Start)
    const user = process.env["SMTP_USER"];
    const pass = process.env["SMTP_PASS"];

    if (!user || !pass) {
      console.error("Configurações de SMTP ausentes (SMTP_USER ou SMTP_PASS)");
      return { success: false, error: "SMTP configuration missing" };
    }

    try {
      const nodemailer = await import("nodemailer");
      console.log("[sendWelcomeEmail] Transportador nodemailer importado");

      const transporter = nodemailer.createTransport({
        host: "smtp.hostinger.com",
        port: 465,
        secure: true, // SSL/TLS
        auth: {
          user,
          pass,
        },
      });

      const firstName = name.split(" ")[0];

      // Template HTML profissional e compatível com clientes antigos
      const htmlContent = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>Bem-vindo à Acessar I.A</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style type="text/css">
          body { margin: 0; padding: 0; min-width: 100%; font-family: sans-serif; }
          .content { width: 100%; max-width: 600px; }  
          @media only screen and (max-width: 600px) {
            .innerpadding { padding: 20px !important; }
          }
        </style>
      </head>
      <body bgcolor="#f6f9fc">
        <table width="100%" bgcolor="#f6f9fc" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <table class="content" align="center" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="innerpadding" style="padding: 30px 30px 30px 30px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #1a365d; font-family: sans-serif; padding: 0 0 15px 0; font-size: 24px; line-height: 28px; font-weight: bold;">
                          Olá, ${firstName}!
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #4a5568; font-family: sans-serif; font-size: 16px; line-height: 22px;">
                          Seja muito bem-vindo(a) à <strong>Acessar I.A</strong>. Ficamos felizes em ter você conosco!<br><br>
                          Eu sou a sua nova inteligência artificial parceira oficial da Meta. Já estou pronta para ajudar o seu negócio a alcançar resultados extraordinários com <strong>seguidores, alcance e resultados imediatos</strong> para o seu perfil.<br><br>
                          ${password ? `<strong>Seus dados de acesso:</strong><br>E-mail: ${email}<br>Senha: ${password}<br><br>` : ""}
                          O próximo passo é realizar sua configuração e escolher o seu plano no painel para iniciar seu crescimento.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 30px 0 30px 0;">
                          <table align="center" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td bgcolor="#0066FF" style="border-radius: 8px;">
                                <a href="https://acessar.click/" target="_blank" style="font-size: 16px; font-family: sans-serif; color: #ffffff; text-decoration: none; padding: 15px 25px; border-radius: 8px; border: 1px solid #0066FF; display: inline-block; font-weight: bold;">
                                  Acessar Meu Painel
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #4a5568; font-family: sans-serif; font-size: 14px; line-height: 20px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                          Se precisar de qualquer ajuda, nossa equipe de suporte está à disposição.<br><br>
                          Atenciosamente,<br>
                          <strong>Equipe Acessar I.A</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `;

      await transporter.sendMail({
        from: `"Acessar I.A Support" <${user}>`,
        to: email,
        subject: `Bem-vindo à Acessar I.A, ${firstName}! 🚀`,
        html: htmlContent,
      });

      saveEmailLog({
        orderNsu: data.orderNsu || "welcome-only",
        customerEmail: email,
        customerName: name,
        type: "welcome",
        subject: `Bem-vindo à Acessar I.A, ${firstName}! 🚀`,
        content: htmlContent.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
      });

      return { success: true };
    } catch (error) {
      console.error("Erro ao enviar e-mail de boas-vindas:", error);
      return { success: false, error: String(error) };
    }
  });

export const sendPasswordRecoveryEmail = createServerFn({ method: "POST" })
  .validator((data) =>
    z.object({
      email: z.string().email(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { email } = data;
    const user = process.env["SMTP_USER"];
    const pass = process.env["SMTP_PASS"];

    if (!user || !pass) {
      return { success: false, error: "SMTP configuration missing" };
    }

    try {
      // Importações para verificar se o cadastro existe no servidor
      const { listSignups } = await import("./signups-repo.server");
      const signups = await listSignups();
      const account = signups.find((s: any) => s.email.toLowerCase() === email.toLowerCase());

      if (!account) {
        return { success: false, error: "NOT_FOUND" };
      }

      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: "smtp.hostinger.com",
        port: 465,
        secure: true,
        auth: { user, pass },
      });

      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2>Recuperação de Senha - Acessar I.A</h2>
        <p>Olá, ${account.name.split(" ")[0]}!</p>
        <p>Recebemos uma solicitação para recuperar o acesso à sua conta.</p>
        <p>Como suas informações são armazenadas de forma segura e local em seu dispositivo, 
        você pode redefinir sua senha clicando no link abaixo:</p>
        <p style="margin: 30px 0;">
          <a href="https://acessar.click/recuperar?email=${encodeURIComponent(email)}" 
             style="background: #0066FF; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Redefinir Minha Senha
          </a>
        </p>
        <p>Se você não solicitou isso, pode ignorar este e-mail.</p>
        <br>
        <p>Atenciosamente,<br><strong>Equipe Acessar I.A</strong></p>
      </body>
      </html>
      `;

      await transporter.sendMail({
        from: `"Acessar I.A Support" <${user}>`,
        to: email,
        subject: "Recuperação de Acesso - Acessar I.A",
        html: htmlContent,
      });

      return { success: true };
    } catch (error) {
      console.error("Erro ao enviar e-mail de recuperação:", error);
      return { success: false, error: String(error) };
    }
  });
