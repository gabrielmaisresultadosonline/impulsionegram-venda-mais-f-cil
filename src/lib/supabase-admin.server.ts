import { createClient } from '@supabase/supabase-js';

// No TanStack Start, variáveis de ambiente são lidas em runtime dentro dos handlers ou
// via process.env em arquivos .server.ts.
// Usamos chaves anônimas para acesso via RLS ou service_role para tarefas administrativas.

export function createSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('Configurações do Lovable Cloud (Supabase) ausentes. Verifique as variáveis de ambiente.');
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export const supabaseAdmin = createSupabaseAdmin();
