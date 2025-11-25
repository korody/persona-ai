// components/header.tsx

'use client'

import Link from 'next/link'
import { useUser } from '@/hooks/use-user'
import { CreditBadge } from './credit-badge'
import { Button } from './ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { User, Settings, CreditCard, LogOut, Menu, GraduationCap, BookOpen, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const ADMIN_EMAILS = ['marko@persona.cx', 'admin@persona.cx'];

export function Header() {
  const { user, isLoading } = useUser()
  const router = useRouter()
  const supabase = createClient()

  const isAdmin = ADMIN_EMAILS.includes(user?.email?.toLowerCase() ?? "");

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between pl-4">
        {/* Logo */}
        <Link href="/chat" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg">Mestre Ye Digital</span>
            <span className="text-xs text-muted-foreground -mt-1">
              Seu Terapeuta Digital 24/7
            </span>
          </div>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {user && !isLoading && (
            <>
              {/* Credit Badge */}
              <CreditBadge />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">
                        {user.user_metadata?.full_name || 'Usuário'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Configurações
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/credits" className="cursor-pointer">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Meus Créditos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a 
                      href="https://wa.me/5511963982121?text=Olá!%20Preciso%20de%20Suporte%20Técnico%20com%20o%20Mestre%20Ye%20Digital" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="cursor-pointer"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Suporte Técnico
                    </a>
                  </DropdownMenuItem>
                  
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin/avatars/mestre-ye/train" className="cursor-pointer bg-green-500/10 text-green-600 dark:text-green-400">
                          <GraduationCap className="mr-2 h-4 w-4" />
                          Painel de Treinamento
                        </Link>
                      </DropdownMenuItem>

                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {!user && !isLoading && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Entrar</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Começar Grátis</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
