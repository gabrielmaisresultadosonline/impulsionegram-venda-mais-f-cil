import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sendTransactionalEmail } from "./transactional-emails.functions";
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
    console.log("[SERVER] Tentando validar admin:", data.adminEmail);
    
    try {
      // 1. Validar admin
      const { data: admin, error: authError } = await supabaseAdmin
        .from("admin_users")
        .select("*")
        .eq("email", data.adminEmail)
        .eq("password", data.adminPassword)
        .single();

      if (authError || !admin) {
        console.error("[SERVER] Erro de autenticação admin:", authError || "Admin não encontrado");
        
        // Log extra para depuração no servidor do cliente
        const { data: countData } = await supabaseAdmin.from("admin_users").select("count", { count: 'exact' });
        console.log("[SERVER] Total de admins na tabela:", countData);

        return { success: false, error: "Credenciais de administrador inválidas" };
      }

      console.log("[SERVER] Admin validado com sucesso:", admin.email);

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
      console.log("[SERVER] Chamando sendTransactionalEmail para:", signup.email);
      
      const result = await sendTransactionalEmail({
        data: {
          type: "welcome",
          email: signup.email,
          name: signup.name,
          password: signup.password
        }
      });

      if (!result.success) {
        console.error("[SERVER] Falha no disparo do e-mail:", result.error);
        return { success: false, error: result.error || "O servidor de e-mail recusou o envio" };
      }

      console.log("[SERVER] E-mail enviado com sucesso para:", signup.email);
      return { success: true };
    } catch (err: any) {
      console.error("[SERVER] Erro crítico no handler de reenvio:", err);
      return { success: false, error: err.message || "Erro interno no servidor" };
    }
  });