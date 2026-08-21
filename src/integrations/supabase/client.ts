import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zxeofffktofjnkkxbwet.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_TcpaCjriuj3DbS25UD1TCA_VQGU22P4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
