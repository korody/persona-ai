import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Brain, MessageSquare, Users, Settings, BarChart3 } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth?redirect=/admin')
  }

  // Verificar se é admin
  const allowedAdminEmails = [
    'marko@persona.cx',
    'admin@qigongbrasil.com',
    'yexin828@hotmail.com'
  ]
  
  if (!allowedAdminEmails.includes(user.email || '')) {
    redirect('/chat')
  }

  // Buscar estatísticas
  // Total de usuários (usando admin client para bypassar RLS)
  const { count: totalUsers } = await adminClient
    .from('users')
    .select('*', { count: 'exact', head: true })

  // Total de conversas (não apenas últimos 7 dias)
  const { count: totalConversations } = await adminClient
    .from('conversations')
    .select('*', { count: 'exact', head: true })

  // Total de mensagens
  const { count: totalMessages } = await adminClient
    .from('messages')
    .select('*', { count: 'exact', head: true })

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold">Usuários Ativos</h3>
            </div>
            <p className="text-3xl font-bold">{totalUsers || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Total de usuários cadastrados</p>
          </div>

          <Link href="/admin/conversations" className="block group">
            <div className="bg-card border rounded-lg p-6 group-hover:border-primary transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold">Conversas</h3>
              </div>
              <p className="text-3xl font-bold">{totalConversations || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Total de conversas criadas</p>
            </div>
          </Link>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <h3 className="font-semibold">Mensagens</h3>
            </div>
            <p className="text-3xl font-bold">{totalMessages || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Total de mensagens enviadas</p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Treinamento do Avatar */}
          <Link href="/admin/avatars/mestre-ye/train" className="group">
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
          <Link href="/admin/review" className="group block">
            <div className="bg-card border rounded-lg p-8 hover:shadow-lg transition-all hover:border-primary h-full">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg shrink-0">
                  <MessageSquare className="h-8 w-8 text-green-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    Revisão de Conversas
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Controle de qualidade e análise detalhada das conversas dos usuários com o avatar.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Avaliação de qualidade das conversas</li>
                    <li>• Sistema de notas e comentários</li>
                    <li>• Identificação de melhorias</li>
                    <li>• Análise de satisfação do usuário</li>
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
      </main>
    )
}
