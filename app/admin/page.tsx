import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Brain, MessageSquare, Users, Settings, BarChart3 } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth?redirect=/admin')
  }

  // Verificar se é admin
  const allowedAdminEmails = [
    'marko@persona.cx',
    'admin@qigongbrasil.com'
  ]
  
  if (!allowedAdminEmails.includes(user.email || '')) {
    redirect('/chat')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">M</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Painel de Administração</h1>
              <p className="text-muted-foreground">Avatar: Mestre Ye Digital</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold">Usuários Ativos</h3>
            </div>
            <p className="text-3xl font-bold">-</p>
            <p className="text-sm text-muted-foreground mt-1">Total de usuários cadastrados</p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold">Conversas</h3>
            </div>
            <p className="text-3xl font-bold">-</p>
            <p className="text-sm text-muted-foreground mt-1">Conversas nos últimos 7 dias</p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <h3 className="font-semibold">Taxa de Satisfação</h3>
            </div>
            <p className="text-3xl font-bold">-</p>
            <p className="text-sm text-muted-foreground mt-1">Baseado em feedback dos usuários</p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Treinamento do Avatar */}
          <Link href="/admin/training" className="group">
            <div className="bg-card border rounded-lg p-8 hover:shadow-lg transition-all hover:border-primary">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    Treinamento do Avatar
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Gerencie a base de conhecimento, documentos e materiais de treinamento do Mestre Ye Digital.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Upload de documentos e PDFs</li>
                    <li>• Gestão da base de conhecimento</li>
                    <li>• Configuração de respostas e personalidade</li>
                    <li>• Teste de conversas e qualidade</li>
                  </ul>
                </div>
              </div>
            </div>
          </Link>

          {/* Revisão de Conversas */}
          <Link href="/admin/conversations" className="group">
            <div className="bg-card border rounded-lg p-8 hover:shadow-lg transition-all hover:border-primary">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <MessageSquare className="h-8 w-8 text-green-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    Revisão de Conversas
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Analise conversas dos usuários com o avatar para identificar melhorias e oportunidades.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Histórico completo de conversas</li>
                    <li>• Filtros por usuário, data e tópico</li>
                    <li>• Análise de qualidade das respostas</li>
                    <li>• Exportação de dados e relatórios</li>
                  </ul>
                </div>
              </div>
            </div>
          </Link>

          {/* Configurações do Avatar */}
          <Link href="/admin/settings" className="group">
            <div className="bg-card border rounded-lg p-8 hover:shadow-lg transition-all hover:border-primary">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <Settings className="h-8 w-8 text-orange-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    Configurações do Avatar
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Configure o comportamento, personalidade e parâmetros do Mestre Ye Digital.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Parâmetros de temperatura e criatividade</li>
                    <li>• Personalidade e tom de voz</li>
                    <li>• Limites e restrições de uso</li>
                    <li>• Integrações e webhooks</li>
                  </ul>
                </div>
              </div>
            </div>
          </Link>

          {/* Análise de Usuários */}
          <Link href="/admin/users" className="group">
            <div className="bg-card border rounded-lg p-8 hover:shadow-lg transition-all hover:border-primary">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    Gestão de Usuários
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Visualize e gerencie os usuários da plataforma e seus acessos.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Lista completa de usuários</li>
                    <li>• Histórico de uso e créditos</li>
                    <li>• Gerenciamento de assinaturas</li>
                    <li>• Suporte e atendimento</li>
                  </ul>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg border">
          <p className="text-sm text-muted-foreground text-center">
            Logado como: <strong>{user.email}</strong> | Acesso: Administrador
          </p>
        </div>
      </main>
    </div>
  )
}
