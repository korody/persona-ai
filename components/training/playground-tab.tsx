'use client'

/**
 * Aba Playground
 * Testar avatar com RAG integrado
 */

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Send, Loader2, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface PlaygroundTabProps {
  avatar: any
}

interface DebugData {
  anamnese: {
    nome: string
    elemento: string
    intensidade: number
    data: string
    hasAnamnese: boolean
  }
  knowledgeBase: {
    total: number
    threshold: number
    maxDocs: number
    items: Array<{
      title: string
      category: string
      similarity: number
      isPrimary: boolean
      isSecondary: boolean
    }>
  }
  exercisesFound?: Array<{
    title: string
    course: string
    similarity: number
    level: string
    element: string
    duration_minutes: number
    enabled: boolean
    benefits: string[]
    indications: string[]
  }>
  conversationContext: {
    messageCount: number
    lastUserMessage: string
    hasAnamnese: boolean
  }
  conversationExamples: {
    total: number
    items: Array<{
      userMessage: string
      assistantResponse: string
      similarity: number
    }>
  }
  searchInfo: {
    method: string
    symptomsFound: string[]
    isGenericRequest: boolean
    elemento: string | null
  }
}

export function PlaygroundTab({ avatar }: PlaygroundTabProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [debugData, setDebugData] = useState<DebugData | null>(null)
  const [loadingDebug, setLoadingDebug] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Removido auto-scroll para não atrapalhar visualização do debug
  // O usuário pode fazer scroll manual se necessário

  const loadDebugData = async (msg: string) => {
    if (!msg.trim() || !avatar) return

    setLoadingDebug(true)
    try {
      const response = await fetch('/api/playground/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: msg,
          messages,
          avatarSlug: avatar.slug 
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch debug data')
      }

      const data = await response.json()
      setDebugData(data)
    } catch (error) {
      console.error('Error loading debug data:', error)
      toast.error('Erro ao carregar debug')
    } finally {
      setLoadingDebug(false)
    }
  }

  async function handleSend() {
    if (!message.trim() || sending || !avatar) return

    const userMessage = message
    setMessage('')
    setSending(true)

    // Carregar debug antes de enviar
    await loadDebugData(userMessage)

    // Adicionar mensagem do usuário
    const newMessages = [...(messages || []), { role: 'user', content: userMessage }]
    setMessages(newMessages)

    console.log('🔍 Debug handleSend:', {
      hasAvatar: !!avatar,
      avatarSlug: avatar?.slug,
      messagesArray: Array.isArray(messages),
      messagesLength: messages?.length || 0,
      newMessagesArray: Array.isArray(newMessages),
      newMessagesLength: newMessages?.length || 0
    })

    try {
      // Obter token de autenticação
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Você precisa estar autenticado')
      }

      if (!Array.isArray(newMessages) || newMessages.length === 0) {
        throw new Error('Mensagens inválidas')
      }

      console.log('Sending to playground API:', {
        avatarSlug: avatar.slug,
        messageCount: newMessages.length,
        hasMessages: Array.isArray(newMessages)
      })

      const messagesToSend = newMessages.map(m => ({
        role: m.role,
        content: m.content
      }))

      console.log('Messages to send:', messagesToSend)

      const response = await fetch('/api/playground/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          messages: messagesToSend,
          avatarSlug: avatar.slug,
        }),
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        let errorMessage = 'Erro ao enviar mensagem'
        try {
          const error = await response.json()
          errorMessage = error.message || error.error || errorMessage
        } catch {
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      // Processar stream de texto
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No reader available')
      }

      // Adicionar mensagem vazia do assistente
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])
      
      let fullText = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break

          const text = decoder.decode(value, { stream: true })
          
          // O stream vem como texto puro, processar linha por linha
          const lines = text.split('\n')
          
          for (const line of lines) {
            if (!line.trim()) continue
            
            // Pode vir com prefixo "0:" ou direto
            let content = line
            if (line.startsWith('0:')) {
              try {
                content = JSON.parse(line.slice(2))
              } catch (e) {
                // Se falhar JSON, usar texto direto
                content = line.slice(2)
              }
            }
            
            fullText += content
            
            // Atualizar mensagem em tempo real
            setMessages(prev => {
              const newMessages = [...prev]
              if (newMessages[newMessages.length - 1]?.role === 'assistant') {
                newMessages[newMessages.length - 1].content = fullText
              }
              return newMessages
            })
          }
        }
      } finally {
        reader.releaseLock()
      }

      setSending(false)
    } catch (error: any) {
      console.error('Error sending message:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      })
      toast.error(error.message || 'Erro ao enviar mensagem')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Erro: ${error.message || 'Ocorreu um erro ao processar sua mensagem.'}`
      }])
      setSending(false)
    }
  }

  const handleClearChat = () => {
    if (confirm('Limpar todo o histórico de chat?')) {
      setMessages([])
      setDebugData(null)
    }
  }

  // Validação do avatar - renderizar mensagem de erro se não houver avatar
  if (!avatar) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            <p>Avatar não encontrado</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Teste o Avatar</CardTitle>
              <CardDescription>
                Conversar com {avatar.name} usando a base de conhecimento atual
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                RAG Ativado
              </Badge>
              {messages.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearChat}
                  className="gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Chat Messages */}
            <div className="h-[500px] overflow-y-auto border rounded-lg p-4 space-y-4 bg-muted/20">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  <div className="text-center space-y-2">
                    <Sparkles className="w-8 h-8 mx-auto opacity-50" />
                    <p>Envie uma mensagem para começar a testar</p>
                    <p className="text-xs">O avatar usará a base de conhecimento para responder</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-muted/80 text-foreground'
                            : 'bg-primary/10 border border-primary/20'
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap break-words prose prose-sm dark:prose-invert max-w-none">
                          {msg.content.split('\n').map((line, i) => (
                            <p key={i} className={line.trim() ? 'mb-2' : 'mb-0'}>
                              {line || '\u00A0'}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {sending && (
                    <div className="flex justify-start">
                      <div className="bg-background border rounded-lg p-3 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Pensando...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Digite sua mensagem..."
                disabled={sending}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={sending || !message.trim()}>
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Panel - Below Chat */}
      {debugData && (
        <Card className="border-green-500/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <CardTitle className="text-lg">🔍 Debug de Contexto da IA</CardTitle>
            </div>
            <CardDescription>
              Dados enviados para a IA na última mensagem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Anamnese Data */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">🩺 Dados da Anamnese</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted/50 rounded p-2">
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="font-medium text-sm">{debugData.anamnese.nome}</p>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <p className="text-xs text-muted-foreground">Elemento</p>
                  <Badge variant="outline">{debugData.anamnese.elemento}</Badge>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <p className="text-xs text-muted-foreground">Intensidade</p>
                  <p className="font-medium text-sm">{debugData.anamnese.intensidade}/10</p>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="font-medium text-sm">{debugData.anamnese.data}</p>
                </div>
              </div>
            </div>

            {/* Knowledge Base Stats */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">📚 Base de Conhecimento Encontrada</h4>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="bg-purple-50 dark:bg-purple-950/20 rounded p-2 border border-purple-200 dark:border-purple-800">
                  <p className="text-xs text-purple-600 dark:text-purple-400">Total</p>
                  <p className="font-bold text-lg text-purple-700 dark:text-purple-300">
                    {debugData.knowledgeBase.total}
                  </p>
                  <p className="text-xs text-purple-600/70">documentos</p>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <p className="text-xs text-muted-foreground">Threshold</p>
                  <p className="font-medium text-sm">{debugData.knowledgeBase.threshold}%</p>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <p className="text-xs text-muted-foreground">Máximo</p>
                  <p className="font-medium text-sm">{debugData.knowledgeBase.maxDocs}</p>
                </div>
              </div>
              {/* Knowledge Items */}
              {debugData.knowledgeBase.items && debugData.knowledgeBase.items.length > 0 && (
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {debugData.knowledgeBase.items.map((item, idx) => (
                    <div key={idx} className="bg-muted/30 rounded p-2 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.title}</p>
                          <p className="text-muted-foreground">{item.category}</p>
                        </div>
                        <div className="flex gap-1 items-center shrink-0">
                          {item.isPrimary && (
                            <Badge variant="default" className="text-[10px] px-1 py-0">
                              1º
                            </Badge>
                          )}
                          {item.isSecondary && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              2º
                            </Badge>
                          )}
                          <span className="text-muted-foreground">{item.similarity}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Conversation Examples */}
            {debugData.conversationExamples && debugData.conversationExamples.total > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm">
                    💬 Exemplos de Conversas ({debugData.conversationExamples.total})
                  </h4>
                </div>
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {debugData.conversationExamples.items.map((example, idx) => (
                    <div key={idx} className="bg-blue-50 dark:bg-blue-950/20 rounded p-2 text-xs border border-blue-200 dark:border-blue-800">
                      <p className="text-muted-foreground mb-1">
                        <span className="font-medium">Usuário:</span> {example.userMessage}...
                      </p>
                      <p className="text-muted-foreground">
                        <span className="font-medium">Avatar:</span> {example.assistantResponse}...
                      </p>
                      <p className="text-right text-[10px] text-blue-600 dark:text-blue-400 mt-1">
                        {example.similarity}% match
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Info */}
            {debugData.searchInfo && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm">🔍 Informações de Busca</h4>
                </div>
                <div className="bg-muted/50 rounded p-3 space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Método de busca</p>
                    <Badge variant="outline" className="mt-1">
                      {debugData.searchInfo.method === 'symptoms' && '🎯 Por sintomas'}
                      {debugData.searchInfo.method === 'generic' && '📚 Genérico'}
                      {debugData.searchInfo.method === 'semantic' && '🧠 Semântico (embeddings)'}
                      {debugData.searchInfo.method === 'element' && '🌳 Por elemento MTC'}
                      {debugData.searchInfo.method === 'none' && '❌ Nenhum'}
                    </Badge>
                  </div>
                  {debugData.searchInfo.symptomsFound.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Sintomas detectados</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {debugData.searchInfo.symptomsFound.map((symptom, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {debugData.searchInfo.isGenericRequest && (
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      ℹ️ Pedido genérico detectado
                    </p>
                  )}
                  {debugData.searchInfo.elemento && (
                    <div>
                      <p className="text-xs text-muted-foreground">Elemento do usuário</p>
                      <Badge variant="outline" className="mt-1">{debugData.searchInfo.elemento}</Badge>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Exercises Found */}
            {debugData.exercisesFound && debugData.exercisesFound.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm">
                    🎯 Exercícios Recomendados ({debugData.exercisesFound.length})
                  </h4>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {debugData.exercisesFound.map((exercise, idx) => (
                    <div 
                      key={idx} 
                      className="bg-muted/50 rounded p-3 space-y-2 border"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{exercise.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {exercise.course}
                          </p>
                        </div>
                        {exercise.enabled ? (
                          <Badge variant="default" className="shrink-0 gap-1 text-xs">
                            ✅ Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="shrink-0 gap-1 text-xs">
                            🚫 Inativo
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {exercise.level}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {exercise.element}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {exercise.duration_minutes}min
                        </Badge>
                        <div className="ml-auto">
                          <Badge variant="secondary" className="text-xs">
                            {(exercise.similarity * 100).toFixed(1)}% match
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation Context */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">💬 Contexto da Conversa</h4>
              </div>
              <div className="bg-muted/50 rounded p-3">
                <p className="text-xs text-muted-foreground mb-1">Mensagens na conversa</p>
                <p className="font-medium text-sm">{debugData.conversationContext.messageCount}</p>
                <p className="text-xs text-muted-foreground mt-2 mb-1">Última mensagem do usuário</p>
                <p className="text-sm italic">&ldquo;{debugData.conversationContext.lastUserMessage}&rdquo;</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}