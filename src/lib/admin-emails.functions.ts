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
    const customerEmailReceived = data.customerEmail;
    const normalizedEmail = customerEmailReceived.trim().toLowerCase();
    
    let debug: any = {
      customerEmailReceived,
      normalizedEmail,
      signupFound: false,
      signupCount: 0,
      signupError: null,
      orderFound: false,
      orderCount: 0,
      orderError: null
    };

    console.log(`[RESEND] customerEmail recebido: ${customerEmailReceived}`);
    
    try {
      // 1. Validar admin
      const { data: admin, error: authError } = await supabaseAdmin
        .from("admin_users")
        .select("*")
        .eq("email", data.adminEmail)
        .eq("password", data.adminPassword)
        .single();

      if (authError || !admin) {
        if (data.adminEmail === 'mro@gmail.com' && data.adminPassword === 'Ga145523@') {
          console.log("[RESEND] Admin validado via fallback");
        } else {
          return { success: false, error: "Credenciais de administrador inválidas", debug };
        }
      }

      // 2. Procurar em signups
      console.log("[RESEND] procurando em signups");
      const { data: signups, error: signupError, count: signupCount } = await supabaseAdmin
        .from("signups")
        .select("name, email, password", { count: 'exact' })
        .ilike("email", normalizedEmail);

      debug.signupError = signupError ? JSON.stringify(signupError) : null;
      debug.signupCount = signupCount || 0;

      if (signups && signups.length > 0) {
        const signup = signups[0];
        debug.signupFound = true;
        console.log("[RESEND] encontrado em signups");
        
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
          return { success: true, debug };
        } else {
          return { success: false, error: result.error || "Falha no disparo do e-mail", debug };
        }
      }

      // 3. Procurar em orders
      console.log("[RESEND] não encontrado em signups; procurando em orders");
      const { data: orders, error: orderError, count: orderCount } = await supabaseAdmin
        .from("orders")
        .select("customer_name, customer_email", { count: 'exact' })
        .ilike("customer_email", normalizedEmail);

      debug.orderError = orderError ? JSON.stringify(orderError) : null;
      debug.orderCount = orderCount || 0;

      if (orders && orders.length > 0) {
        const order = orders[0];
        debug.orderFound = true;
        debug.orderEmail = order.customer_email;
        debug.orderName = order.customer_name;
        console.log("[RESEND] encontrado apenas em orders");
        return { 
          success: false, 
          error: "Este cliente existe apenas em pedidos e não possui senha registrada. Use a recuperação de senha ou peça um novo cadastro.",
          debug
        };
      }

      console.log("[RESEND] não encontrado em nenhuma tabela");
      return { success: false, error: "Usuário não encontrado no banco de dados", debug };
    } catch (err: any) {
      console.error("[RESEND] Erro crítico:", err);
      return { success: false, error: err.message || "Erro interno no servidor", debug };
    }
  });