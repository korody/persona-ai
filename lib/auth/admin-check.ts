// lib/auth/admin-check.ts

import { createClient } from '@/lib/supabase/server'

const ALLOWED_ADMIN_EMAILS = [
  'marko@persona.cx',
  'admin@qigongbrasil.com'
]

export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.email) return false
    
    return ALLOWED_ADMIN_EMAILS.includes(user.email)
  } catch {
    return false
  }
}

export async function requireAdmin() {
  const admin = await isAdmin()
  
  if (!admin) {
    throw new Error('Unauthorized: Admin access required')
  }
}
