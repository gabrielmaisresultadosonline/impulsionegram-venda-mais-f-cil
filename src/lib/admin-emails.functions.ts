import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { resendWelcomeEmail } from "./transactional-emails.functions";
import { supabaseAdmin } from "./supabase.server";

// Função única e definitiva para reenvio de e-mail de boas-vindas pelo admin
export const adminResendWelcomeEmailFinal = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        adminEmail: z.string(),
        adminPassword: z.string(),
        customerEmail: z.string(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    console.log("[SERVER] Iniciando reenvio de e-mail:", data.customerEmail);
    
    try {
      // 1. Validar admin
      const { data: admin, error: authError } = await supabaseAdmin
        .from("admin_users")
        .select("id")
        .eq("email", data.adminEmail)
        .eq("password", data.adminPassword)
        .single();

      if (authError || !admin) {
        console.error("[SERVER] Erro de autenticação admin:", data.adminEmail);
        return { success: false, error: "Credenciais de administrador inválidas" };
      }

      // 2. Buscar dados do usuário
      const { data: signup, error: signupError } = await supabaseAdmin
        .from("signups")
        .select("name, email, password")
        .eq("email", data.customerEmail)
        .single();

      if (signupError || !signup) {
        console.error("[SERVER] Usuário não encontrado:", data.customerEmail);
        return { success: false, error: "Usuário não encontrado no banco de dados" };
      }

      // 3. Enviar e-mail usando a função transacional
      console.log("[SERVER] Chamando resendWelcomeEmail para:", signup.email);
      const emailSent = await resendWelcomeEmail(
        signup.name,
        signup.email,
        signup.password
      );

      if (!emailSent) {
        console.error("[SERVER] Falha no disparo do e-mail via nodemailer");
        return { success: false, error: "O servidor de e-mail (SMTP) recusou o envio" };
      }

      console.log("[SERVER] E-mail enviado com sucesso para:", signup.email);
      return { success: true };
    } catch (err: any) {
      console.error("[SERVER] Erro crítico no handler de reenvio:", err);
      return { success: false, error: err.message || "Erro interno no servidor" };
    }
  });