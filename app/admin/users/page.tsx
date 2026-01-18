import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function UsersPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth?redirect=/admin/users')
  }

  const allowedAdminEmails = [
    'marko@persona.cx',
    'admin@qigongbrasil.com'
  ]
  
  if (!allowedAdminEmails.includes(user.email || '')) {
    redirect('/chat')
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            🚧 <strong>Em Desenvolvimento</strong> - Esta funcionalidade estará disponível em breve.
          </p>
        </div>
      </main>
  )
}
