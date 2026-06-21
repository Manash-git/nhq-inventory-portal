import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

export const ROLES = {
  ROOT: 'root',
  ADMIN: 'admin',
  NHQ: 'nhq'
}

export const USER_CREDENTIALS = {
  root: { username: 'manash@nhqbd.com', password: 'Man&Mond71', role: 'root', name: 'Manash Kumar Mondal' },
  admin: { username: 'admin', password: 'Man@321%', role: 'admin', name: 'Admin User' },
  nhq: { username: 'nhq', password: 'Nhq@321%', role: 'nhq', name: 'NHQ User' }
}
