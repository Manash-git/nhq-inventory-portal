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
  SUPER_USER: 'super_user',
  ADMIN: 'admin',
  READ_ONLY: 'read_only'
}

// Role hierarchy for permission checks
export const ROLE_HIERARCHY = {
  super_user: 3,
  admin: 2,
  read_only: 1
}

export function canManageUsers(role) {
  return role === ROLES.SUPER_USER
}

export function canModifyInventory(role) {
  return role === ROLES.SUPER_USER || role === ROLES.ADMIN
}

export function canExport(role) {
  return role === ROLES.SUPER_USER || role === ROLES.ADMIN
}

export function canViewAllLogs(role) {
  return role === ROLES.SUPER_USER
}

export function canViewAdminLogs(role) {
  return role === ROLES.ADMIN
}