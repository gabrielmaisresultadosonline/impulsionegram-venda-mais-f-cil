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
    const customerEmail = data.customerEmail.trim().toLowerCase();
    console.log(`[RESEND] customerEmail recebido: ${customerEmail}`);
    
    try {
      // 1. Validar admin
      const { data: admin, error: authError } = await supabaseAdmin
        .from("admin_users")
        .select("*")
        .eq("email", data.adminEmail)
        .eq("password", data.adminPassword)
        .single();

      if (authError || !admin) {
        // Fallback para admin fixo mro@gmail.com
        if (data.adminEmail === 'mro@gmail.com' && data.adminPassword === 'Ga145523@') {
          console.log("[RESEND] Admin validado via fallback");
        } else {
          return { success: false, error: "Credenciais de administrador inválidas" };
        }
      }

      // 2. Procurar primeiro em signups usando comparação case-insensitive
      console.log("[RESEND] procurando em signups");
      const { data: signup, error: signupError } = await supabaseAdmin
        .from("signups")
        .select("name, email, password")
        .ilike("email", customerEmail)
        .maybeSingle();

      if (signup && !signupError) {
        console.log("[RESEND] encontrado em signups");
        console.log("[RESEND] enviando e-mail welcome");
        
        const result = await sendTransactionalEmail({
          data: {
            type: "welcome",
            email: signup.email,
            name: signup.name,
            password: signup.password
          }
        });

        if (result.success) {
          console.log("[RESEND] e-mail enviado com sucesso");
          return { success: true };
        } else {
          return { success: false, error: result.error || "Falha no disparo do e-mail" };
        }
      }

      // 3. Se não encontrar em signups, procurar o cliente em orders
      console.log("[RESEND] não encontrado em signups; procurando em orders");
      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .select("customer_name, customer_email")
        .ilike("customer_email", customerEmail)
        .limit(1)
        .maybeSingle();

      if (order && !orderError) {
        console.log("[RESEND] encontrado apenas em orders");
        return { 
          success: false, 
          error: "Este cliente existe apenas em pedidos e não possui senha registrada. Use a recuperação de senha ou peça um novo cadastro." 
        };
      }

      console.log("[RESEND] não encontrado em nenhuma tabela");
      return { success: false, error: "Usuário não encontrado no banco de dados" };
    } catch (err: any) {
      console.error("[RESEND] Erro crítico:", err);
      return { success: false, error: err.message || "Erro interno no servidor" };
    }
  });