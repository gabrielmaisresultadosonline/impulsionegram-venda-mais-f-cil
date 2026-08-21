import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sendTransactionalEmailInternal } from "./transactional-emails.functions";
import { supabaseAdmin } from "./supabase.server";

/**
 * Função única e definitiva para reenvio de e-mail de boas-vindas pelo admin.
 * Chamada pelo componente SignupsCard no Admin.
 */
export const adminResendWelcomeEmail = createServerFn({ method: "POST" })
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

    console.log(`[ADMIN-RESEND] Início para: ${normalizedEmail}`);
    
    try {
      // 1. Validar admin
      const { data: admin, error: authError } = await supabaseAdmin
        .from("admin_users")
        .select("*")
        .eq("email", data.adminEmail)
        .eq("password", data.adminPassword)
        .single();

      if (authError || !admin) {
        // Fallback para admin mestre se a tabela estiver vazia ou credenciais mudarem
        if (data.adminEmail === 'mro@gmail.com' && data.adminPassword === 'Ga145523@') {
          console.log("[ADMIN-RESEND] Admin validado via fallback fixo");
        } else {
          return { success: false, error: "Credenciais de administrador inválidas", debug };
        }
      }

      // 2. Procurar em signups
      const { data: signups, error: signupError, count: signupCount } = await supabaseAdmin
        .from("signups")
        .select("name, email", { count: 'exact' })
        .ilike("email", normalizedEmail);

      debug.signupError = signupError ? JSON.stringify(signupError) : null;
      debug.signupCount = signupCount || 0;

      if (signups && signups.length > 0) {
        const signup = signups[0];
        debug.signupFound = true;
        console.log("[ADMIN-RESEND] Usuário encontrado em signups");
        
        // Chama a implementação interna DIRETAMENTE (sem RPC)
        const result = await sendTransactionalEmailInternal({
          type: "welcome",
          email: signup.email,
          name: signup.name,
          // Não temos a senha aqui (não é salva no banco por segurança)
          // O template do e-mail oferecerá o link de recuperação.
        });

        if (result.success) {
          return { success: true, debug };
        } else {
          return { success: false, error: result.error || "Falha no disparo do e-mail", debug };
        }
      }

      // 3. Procurar em orders (fallback se não estiver em signups)
      const { data: orders, error: orderError, count: orderCount } = await supabaseAdmin
        .from("orders")
        .select("customer_name, customer_email", { count: 'exact' })
        .ilike("customer_email", normalizedEmail);

      debug.orderError = orderError ? JSON.stringify(orderError) : null;
      debug.orderCount = orderCount || 0;

      if (orders && orders.length > 0) {
        const order = orders[0];
        debug.orderFound = true;
        console.log("[ADMIN-RESEND] Usuário encontrado apenas em orders");
        
        const result = await sendTransactionalEmailInternal({
          type: "welcome",
          email: order.customer_email,
          name: order.customer_name,
        });

        if (result.success) {
          return { success: true, debug };
        } else {
          return { success: false, error: result.error || "Falha no disparo do e-mail", debug };
        }
      }

      return { success: false, error: "Usuário não encontrado em nossos registros (Cadastros ou Pedidos)", debug };
    } catch (err: any) {
      console.error("[ADMIN-RESEND] Erro crítico:", err);
      return { success: false, error: err.message || "Erro interno no servidor", debug };
    }
  });