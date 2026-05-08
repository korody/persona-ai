import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Search, Filter, Star, MessageSquare, Calendar, User, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

export default async function ReviewPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth?redirect=/admin/review')
  }

  const allowedAdminEmails = [
    'marko@persona.cx',
    'admin@qigongbrasil.com',
    'yexin828@hotmail.com'
  ]
  
  if (!allowedAdminEmails.includes(user.email || '')) {
    redirect('/chat')
  }

  // Buscar conversas do próprio usuário ou todas (dependendo da permissão)
  const { data: conversations, error: conversationsError } = await supabase
    .from('conversations')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(50)

  // Buscar contagem de mensagens por conversa
  const conversationIds = conversations?.map(c => c.id) || []
  let messageCounts: any[] | null = null
  let allMessages: any[] | null = null
  
  if (conversationIds.length > 0) {
    const { data } = await supabase
      .from('messages')
      .select('conversation_id, role, content, created_at')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: true })
    
    allMessages = data
    messageCounts = data
  }

  // Buscar informações dos usuários
  const userIds = [...new Set(conversations?.map(c => c.user_id).filter(Boolean) || [])]
  let usersData: any[] | null = null
  
  if (userIds.length > 0) {
    const { data } = await supabase
      .from('users')
      .select('id, email, full_name')
      .in('id', userIds)
    usersData = data
  }

  console.log('=== DEBUG CONVERSAS ===')
  console.log('Total encontradas:', conversations?.length || 0)
  console.log('Erro:', conversationsError)
  console.log('Email do admin:', user.email)
  console.log('IDs das conversas:', conversationIds.slice(0, 3))
  console.log('Total de mensagens buscadas:', allMessages?.length || 0)
  console.log('Primeiras 3 mensagens:', allMessages?.slice(0, 3))

  // Criar mapa de usuários
  const usersMap = (usersData || []).reduce((acc: Record<string, any>, user: any) => {
    acc[user.id] = user
    return acc
  }, {})

  // Criar mapa de contagem
  const messageCountMap = (messageCounts || []).reduce((acc: Record<string, number>, msg: any) => {
    acc[msg.conversation_id] = (acc[msg.conversation_id] || 0) + 1
    return acc
  }, {})

  // Criar mapa de mensagens por conversa
  const messagesMap = (allMessages || []).reduce((acc: Record<string, any[]>, msg: any) => {
    if (!acc[msg.conversation_id]) {
      acc[msg.conversation_id] = []
    }
    acc[msg.conversation_id].push(msg)
    return acc
  }, {})

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Filtros */}
        <div className="bg-card border rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuário, título ou conteúdo..."
                  className="pl-10"
                  disabled
                />
              </div>
            </div>
            <Button variant="outline" disabled>
              <Filter className="h-4 w-4 mr-2" />
              Filtrar por Status
            </Button>
            <Button variant="outline" disabled>
              <Calendar className="h-4 w-4 mr-2" />
              Filtrar por Data
            </Button>
          </div>
        </div>

        {/* Lista de Conversas */}
        <div className="space-y-3">
          {conversations && conversations.length > 0 ? (
            conversations.map((conversation: any) => {
              const user = usersMap[conversation.user_id]
              const userEmail = user?.email || 'Usuário desconhecido'
              const userName = user?.full_name || null
              const messageCount = messageCountMap[conversation.id] || 0
              const messages = messagesMap[conversation.id] || []
              const lastUserMessage = messages.filter(m => m.role === 'user').pop()
              const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop()

              return (
                <div key={conversation.id} className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base font-semibold truncate">
                          {conversation.title || 'Nova conversa'}
                        </h3>
                        <Badge variant="secondary" className="gap-1 text-xs shrink-0">
                          <MessageSquare className="h-3 w-3" />
                          {messageCount}
                        </Badge>
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600 text-xs shrink-0">
                          Pendente
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="truncate">{userName || userEmail}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(conversation.started_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.round((Date.now() - new Date(conversation.started_at).getTime()) / (1000 * 60 * 60 * 24))}d
                        </div>
                      </div>

                      {/* Preview das Mensagens */}
                      {(lastUserMessage || lastAssistantMessage) && (
                        <div className="space-y-2 text-sm leading-relaxed">
                          {lastUserMessage && (
                            <div className="flex gap-2">
                              <Badge variant="secondary" className="text-[10px] h-5 shrink-0">Usuário</Badge>
                              <p className="text-muted-foreground line-clamp-4 flex-1">
                                {lastUserMessage.content}
                              </p>
                            </div>
                          )}
                          {lastAssistantMessage && (
                            <div className="flex gap-2">
                              <Badge className="bg-green-600 text-[10px] h-5 shrink-0">Mestre Ye</Badge>
                              <p className="text-muted-foreground line-clamp-4 flex-1">
                                {lastAssistantMessage.content}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <Link href={`/admin/conversations/${conversation.id}`}>
                        <Button size="sm" className="text-xs h-8">
                          Revisar
                        </Button>
                      </Link>
                      <div className="flex items-center gap-1 justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            className="text-gray-300 hover:text-yellow-400 transition-colors"
                            disabled
                          >
                            <Star className="h-3 w-3" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="bg-card border rounded-lg p-12 text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma conversa encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Ainda não há conversas para revisar.
              </p>
              {conversationsError && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-left">
                  <p className="text-sm font-mono text-red-500">
                    Erro: {JSON.stringify(conversationsError, null, 2)}
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Total de conversas retornadas: {conversations?.length || 0}
              </p>
            </div>
          )}
        </div>

        {/* Estatísticas de Revisão */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Próximas Funcionalidades</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✨ Sistema de avaliação por estrelas</li>
              <li>📝 Notas e comentários em conversas</li>
              <li>🏷️ Tags e categorização automática</li>
              <li>📊 Análise de sentimento</li>
              <li>🔍 Busca avançada e filtros</li>
              <li>📈 Relatórios de qualidade</li>
            </ul>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Indicadores de Qualidade</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Tempo de Resposta</span>
                  <span className="text-muted-foreground">-</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full w-0"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Satisfação do Usuário</span>
                  <span className="text-muted-foreground">-</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full w-0"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Precisão das Respostas</span>
                  <span className="text-muted-foreground">-</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full w-0"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Ações Rápidas</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" disabled>
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar todas como revisadas
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                <Star className="h-4 w-4 mr-2" />
                Ver conversas de alta qualidade
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                <AlertCircle className="h-4 w-4 mr-2" />
                Ver conversas problemáticas
              </Button>
            </div>
          </div>
        </div>
      </div>
  )
}
