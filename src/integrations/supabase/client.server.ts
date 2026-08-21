import { createClient } from '@supabase/supabase-js'

// Estas chaves devem ser configuradas via Environment Variables em produção
const supabaseUrl = process.env.SUPABASE_URL || 'https://zxeofffktofjnkkxbwet.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY não configurada. Algumas operações administrativas podem falhar.')
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
