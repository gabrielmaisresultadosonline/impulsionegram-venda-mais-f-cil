import { createClient } from '@supabase/supabase-js'

// Estas chaves devem ser configuradas via Environment Variables em produção
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zxeofffktofjnkkxbwet.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_TcpaCjriuj3DbS25UD1TCA_VQGU22P4' // Fallback para dev, em prod use a service role

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

