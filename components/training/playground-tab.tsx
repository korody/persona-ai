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

export function PlaygroundTab({ avatar }: PlaygroundTabProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function handleSend() {
    if (!message.trim() || sending || !avatar) return

    const userMessage = message
    setMessage('')
    setSending(true)

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
    <div className="space-y-6">
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
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background border'
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
    </div>
  )
}
