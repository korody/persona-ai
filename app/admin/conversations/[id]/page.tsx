import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Clock, User, MessageSquare, ThumbsUp, ThumbsDown, Flag, Download, Brain, Star, CheckCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

interface ConversationDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ConversationDetailPage({ params }: ConversationDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth?redirect=/admin/conversations')
  }

  const allowedAdminEmails = [
    'marko@persona.cx',
    'equipe@qigongbrasil.com',
    'yexin828@hotmail.com'
  ]
  
  if (!allowedAdminEmails.includes(user.email || '')) {
    redirect('/chat')
  }

  // Buscar conversa específica
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single()

  console.log('Buscando conversa:', id)
  console.log('Conversa encontrada:', conversation)
  console.log('Erro:', convError)

  if (!conversation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Conversa não encontrada</h1>
          <p className="text-muted-foreground mb-4">ID: {id}</p>
          <p className="text-sm text-red-500 mb-4">Erro: {JSON.stringify(convError)}</p>
          <Link href="/admin/review">
            <Button>Voltar para Revisão</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Buscar informações do usuário
  const { data: userData } = await supabase
    .from('users')
    .select('email, full_name')
    .eq('id', conversation.user_id)
    .single()

  const userEmail = userData?.email || 'Usuário desconhecido'

  // Buscar mensagens da conversa
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  // Estatísticas da conversa
  const userMessages = messages?.filter(m => m.role === 'user').length || 0
  const assistantMessages = messages?.filter(m => m.role === 'assistant').length || 0
  const totalMessages = messages?.length || 0

  // Calcular duração da conversa
  const firstMessage = messages?.[0]
  const lastMessage = messages?.[messages.length - 1]
  const duration = firstMessage && lastMessage 
    ? Math.round((new Date(lastMessage.created_at).getTime() - new Date(firstMessage.created_at).getTime()) / 60000)
    : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/conversations">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">{conversation.title || 'Nova conversa'}</h1>
                <p className="text-sm text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/avatars/mestre-ye/train">
                <Button variant="default" size="sm">
                  <Brain className="h-4 w-4 mr-2" />
                  Treinamento
                </Button>
              </Link>
              <Button variant="outline" size="sm" disabled>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Flag className="h-4 w-4 mr-2" />
                Marcar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Estatísticas */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border rounded-lg p-6 sticky top-24">
              <h2 className="font-semibold mb-4">Estatísticas</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <MessageSquare className="h-4 w-4" />
                    Total de Mensagens
                  </div>
                  <p className="text-2xl font-bold">{totalMessages}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <User className="h-4 w-4" />
                    Mensagens do Usuário
                  </div>
                  <p className="text-2xl font-bold">{userMessages}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <MessageSquare className="h-4 w-4" />
                    Respostas do Avatar
                  </div>
                  <p className="text-2xl font-bold">{assistantMessages}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    Duração
                  </div>
                  <p className="text-2xl font-bold">
                    {duration > 0 ? `${duration}min` : '-'}
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground mb-1">Criada em</div>
                  <p className="text-sm font-medium">
                    {new Date(conversation.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(conversation.created_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div className="pt-2">
                  <div className="text-sm text-muted-foreground mb-1">Última atividade</div>
                  <p className="text-sm font-medium">
                    {new Date(conversation.updated_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(conversation.updated_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Mensagens */}
          <div className="lg:col-span-3">
            <div className="bg-card border rounded-lg">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">Histórico da Conversa</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {totalMessages} mensagem{totalMessages !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="p-6 space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
                {messages && messages.length > 0 ? (
                  messages.map((message: any, index: number) => (
                    <div key={message.id} className="group">
                      {/* Mensagem do Usuário */}
                      {message.role === 'user' && (
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">Usuário</Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mensagem do Assistente */}
                      {message.role === 'assistant' && (
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                              <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="default" className="bg-green-600">Mestre Ye</Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                            
                            {/* Ações de Avaliação */}
                            <div className="flex gap-2 pt-2">
                              <Button variant="ghost" size="sm" disabled className="h-7 text-xs">
                                <ThumbsUp className="h-3 w-3 mr-1" />
                                Boa
                              </Button>
                              <Button variant="ghost" size="sm" disabled className="h-7 text-xs">
                                <ThumbsDown className="h-3 w-3 mr-1" />
                                Ruim
                              </Button>
                              <Button variant="ghost" size="sm" disabled className="h-7 text-xs">
                                <Flag className="h-3 w-3 mr-1" />
                                Sinalizar
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mensagem do Sistema */}
                      {message.role === 'system' && (
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                              <MessageSquare className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </div>
                          </div>
                          <div className="flex-1 space-y-1">
                            <Badge variant="outline">Sistema</Badge>
                            <div className="bg-gray-50 dark:bg-gray-900/30 border rounded-lg p-4">
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {message.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma mensagem encontrada</p>
                  </div>
                )}
              </div>
            </div>

            {/* Painel de Revisão */}
            <div className="mt-6 bg-card border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Revisão e Controle de Qualidade</h3>
              
              {/* Avaliação Geral */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Qualidade Geral da Conversa</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className="text-gray-300 hover:text-yellow-400 transition-colors"
                      disabled
                    >
                      <Star className="h-6 w-6" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Status da Revisão */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Status da Revisão</label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled className="gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Aprovar Conversa
                  </Button>
                  <Button variant="outline" size="sm" disabled className="gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Marcar para Atenção
                  </Button>
                  <Button variant="outline" size="sm" disabled className="gap-2">
                    <Flag className="h-4 w-4 text-red-500" />
                    Sinalizar Problema
                  </Button>
                </div>
              </div>

              {/* Notas do Revisor */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Notas do Revisor</label>
                <Textarea 
                  placeholder="Adicione observações, pontos de melhoria ou insights sobre esta conversa..."
                  className="min-h-[100px]"
                  disabled
                />
              </div>

              <div className="flex gap-2">
                <Button size="sm" disabled>Salvar Revisão</Button>
                <Button variant="outline" size="sm" disabled>Exportar Análise</Button>
              </div>

              {/* Info */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  💡 <strong>Em breve:</strong> Sistema de avaliação persistente, tags automáticas, análise de sentimento e relatórios de qualidade.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
