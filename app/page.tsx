// app/page.tsx

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MessageSquare, Sparkles, Clock, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">Mestre Ye Digital</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Começar Grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center bg-background">
        <div className="container max-w-7xl mx-auto py-16 md:py-24 px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Converse com o{' '}
              <span className="bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">Mestre Ye</span>
              <br />
              24 horas por dia
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Especialista em Medicina Tradicional Chinesa com 30+ anos de experiência, 
              sempre disponível para orientar você sobre saúde e bem-estar.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" asChild className="text-lg px-8 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900">
                <Link href="/signup">
                  Começar Grátis
                  <Sparkles className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8">
                <Link href="/pricing">
                  Ver Planos
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>20 créditos grátis</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Dados seguros</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-background">
        <div className="container max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Por que escolher o Mestre Ye Digital?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                <MessageSquare className="h-6 w-6 text-slate-700 dark:text-slate-300" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Sempre Disponível</h3>
              <p className="text-muted-foreground text-sm">
                Converse com o Mestre Ye a qualquer hora, de qualquer lugar. 
                Suporte 24/7 sem agendamento.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                <span className="text-2xl">🌳</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Diagnóstico MTC</h3>
              <p className="text-muted-foreground text-sm">
                Baseado nos 5 Elementos da Medicina Tradicional Chinesa 
                para tratamento holístico.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                <span className="text-2xl">🧘</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Método Ye Xin</h3>
              <p className="text-muted-foreground text-sm">
                Exercícios personalizados de Qigong e acupuntura sem agulhas 
                para sua condição específica.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900 border-t">
        <div className="container max-w-7xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-4">
            Pronto para começar sua jornada?
          </h2>
          <p className="text-lg mb-8 text-muted-foreground max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que já melhoraram sua qualidade de vida 
            com a orientação do Mestre Ye.
          </p>
          <Button size="lg" asChild className="text-lg px-8 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900">
            <Link href="/signup">
              Criar Conta Grátis
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-background">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <span className="font-bold text-lg">Mestre Ye Digital</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Medicina Tradicional Chinesa acessível para todos.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/pricing">Preços</Link></li>
                <li><Link href="/chat">Chat</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="https://qigongbrasil.com">Qigong Brasil</a></li>
                <li><a href="#">Sobre o Mestre Ye</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/termos">Termos de Uso</Link></li>
                <li><Link href="/privacidade">Privacidade</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2025 Mestre Ye Digital - Qigong Brasil. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
