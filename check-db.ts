import { supabaseAdmin } from "./src/lib/supabase.server";

async function check() {
  console.log("--- Settings ---");
  const { data: settings, error: sErr } = await supabaseAdmin
    .from('settings')
    .select('*')
    .eq('id', 'global')
    .single();
  console.log("Settings data:", settings);
  if (sErr) console.error("Settings error:", sErr);

  console.log("\n--- Signups (Last 5) ---");
  const { data: signups, error: sigErr } = await supabaseAdmin
    .from('signups')
    .select('email, name, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log("Signups:", signups);
  if (sigErr) console.error("Signups error:", sigErr);

  console.log("\n--- Orders (Last 5) ---");
  const { data: orders, error: oErr } = await supabaseAdmin
    .from('orders')
    .select('customer_email, customer_name, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log("Orders:", orders);
  if (oErr) console.error("Orders error:", oErr);
}

check().catch(console.error);
