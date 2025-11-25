'use client'

import { useState, useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport } from 'ai'
import { Header } from '@/components/header'
import { ChatMessage } from '@/components/chat-message'
import { ChatInput } from '@/components/chat-input'
import { ConversationsSidebar } from '@/components/conversations-sidebar'
import { QuizStatusBadge } from '@/components/quiz-status-badge'
import { Button } from '@/components/ui/button'
import { useCredits } from '@/hooks/use-credits'
import { useConversations } from '@/hooks/use-conversations'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Volume2, VolumeX } from 'lucide-react'

// Helper para extrair texto de uma UIMessage
function getMessageText(message: any): string {
  if (!message?.parts) return ''
  return message.parts
    .filter((part: any) => part.type === 'text')
    .map((part: any) => part.text)
    .join('')
}

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)
  const [videoError, setVideoError] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { mutate: mutateCredits } = useCredits()
  const { mutate: mutateConversations } = useConversations()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const chat = useChat({
    transport: new TextStreamChatTransport({
      api: '/api/chat',
      async headers() {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        return {
          'Authorization': `Bearer ${session?.access_token || ''}`,
        }
      },
      body: {
        conversationId,
        avatarSlug: 'mestre-ye',
      },
    }),
    onFinish() {
      mutateCredits()
      // Atualizar lista de conversas após nova mensagem
      mutateConversations()
    },
  })

  const messages = chat.messages
  const isLoading = chat.status === 'submitted'
  const error = chat.error

  // Autoscroll quando houver novas mensagens ou durante streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Tentar ativar som após primeira interação do usuário
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (videoRef.current && isMuted) {
        videoRef.current.muted = false
        setIsMuted(false)
        // Remover listeners após primeira interação
        document.removeEventListener('click', handleFirstInteraction)
        document.removeEventListener('keydown', handleFirstInteraction)
      }
    }

    document.addEventListener('click', handleFirstInteraction)
    document.addEventListener('keydown', handleFirstInteraction)

    return () => {
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('keydown', handleFirstInteraction)
    }
  }, [isMuted])

  // Se não temos conversationId mas temos mensagens, buscar o ID da conversa recém-criada
  useEffect(() => {
    if (!conversationId && messages.length >= 2) {
      // Após primeira mensagem completa, tentar buscar a última conversa
      const fetchLatestConversation = async () => {
        try {
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) return

          const response = await fetch('/api/conversations', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.conversations && data.conversations.length > 0) {
              const latestConv = data.conversations[0]
              setConversationId(latestConv.id)
              console.log('✅ Conversa criada:', latestConv.id)
            }
          }
        } catch (err) {
          console.error('Erro ao buscar conversa:', err)
        }
      }
      
      fetchLatestConversation()
    }
  }, [conversationId, messages.length])

  const handleSend = async (message: string) => {
    await chat.sendMessage({
      parts: [{ type: 'text', text: message }],
    })
  }

  // Função para iniciar nova conversa
  const handleNewConversation = () => {
    setConversationId(null)
    chat.setMessages([])
  }

  // Função para carregar uma conversa existente
  const handleSelectConversation = async (convId: string) => {
    try {
      setConversationId(convId)
      console.log('Carregando conversa:', convId)

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Buscar mensagens da conversa
      const response = await fetch(`/api/conversations/${convId}/messages`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        // Converter mensagens do banco para formato UIMessage
        const uiMessages = data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          parts: [{ type: 'text', text: msg.content }]
        }))

        // Setar as mensagens no chat
        chat.setMessages(uiMessages)
        console.log('✅ Mensagens carregadas:', uiMessages.length)
      }
    } catch (error) {
      console.error('Erro ao carregar conversa:', error)
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {!isSidebarCollapsed && (
          <ConversationsSidebar 
            onNewConversation={handleNewConversation}
            onSelectConversation={handleSelectConversation}
            currentConversationId={conversationId}
            onToggleSidebar={() => setIsSidebarCollapsed(true)}
          />
        )}

        <div className="flex flex-1 flex-col">
          {/* Toggle Sidebar Button - Only when collapsed */}
          {isSidebarCollapsed && (
            <div className="border-b px-4 py-2 bg-muted/10">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSidebarCollapsed(false)}
                    className="shrink-0"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Mostrar Histórico
                  </Button>

                  {/* Status Bar */}
                  {messages.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {conversationId ? (
                        <span>Conversa salva</span>
                      ) : (
                        <span>Nova conversa • Será salva ao enviar a primeira mensagem</span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Quiz Status Badge */}
                <QuizStatusBadge onSendDiagnosis={(message) => {
                  chat.append({
                    role: 'user',
                    content: message
                  })
                }} />
              </div>
            </div>
          )}
          
          {/* Status Bar when sidebar is open */
          {!isSidebarCollapsed && messages.length > 0 && (
            <div className="border-b px-4 py-2 bg-muted/10">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {conversationId ? (
                    <span>Conversa salva</span>
                  ) : (
                    <span>Nova conversa • Será salva ao enviar a primeira mensagem</span>
                  )}
                </div>
                
                {/* Quiz Status Badge */}
                <QuizStatusBadge onSendDiagnosis={(message) => {
                  chat.append({
                    role: 'user',
                    content: message
                  })
                }} />
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto bg-black">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center px-4 bg-black">
                <div className="w-full max-w-4xl">
                  {/* Vídeo de Saudação ou Ícone */}
                  {!videoError ? (
                    <>
                      <div className="mb-8">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl w-full">
                          <video
                            ref={videoRef}
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="auto"
                            className="w-full h-auto"
                            onError={(e) => {
                              console.error('Erro ao carregar vídeo:', e)
                              setVideoError(true)
                            }}
                            onLoadedData={() => {
                              console.log('Vídeo carregado com sucesso')
                              // Tentar forçar play caso não tenha iniciado automaticamente
                              videoRef.current?.play().catch(err => {
                                console.log('Autoplay bloqueado:', err)
                              })
                            }}
                          >
                            <source src="/videos/mestre-ye-welcome-webm.webm" type="video/webm" />
                            <source src="/videos/mestre-ye-welcome-mov.mov" type="video/quicktime" />
                            <source src="/videos/mestre-ye-welcome-mp4.mp4" type="video/mp4" />
                            Seu navegador não suporta vídeo HTML5.
                          </video>
                          
                          {/* Botão de Som */}
                          <button
                            onClick={() => {
                              if (videoRef.current) {
                                videoRef.current.muted = !isMuted
                                setIsMuted(!isMuted)
                              }
                            }}
                            className="absolute bottom-4 right-4 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors backdrop-blur-sm"
                            aria-label={isMuted ? 'Ativar som' : 'Desativar som'}
                          >
                            {isMuted ? (
                              <VolumeX className="h-5 w-5 text-white" />
                            ) : (
                              <Volume2 className="h-5 w-5 text-white" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-center text-sm text-muted-foreground space-y-2">
                        <p>💬 Pergunte sobre dores, sintomas ou desequilíbrios</p>
                        <p>🌳 Descubra qual elemento está desbalanceado</p>
                        <p>🧘 Receba exercícios personalizados do Método Ye Xin</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-700 shadow-xl">
                        <MessageSquare className="h-12 w-12 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">
                        Olá! Sou o Mestre Ye
                      </h2>
                      <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                        Especialista em Medicina Tradicional Chinesa com mais de 30 anos de experiência. 
                        Como posso ajudá-lo hoje?
                      </p>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>💬 Pergunte sobre dores, sintomas ou desequilíbrios</p>
                        <p>🌳 Descubra qual elemento está desbalanceado</p>
                        <p>🧘 Receba exercícios personalizados do Método Ye Xin</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-4xl">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role as 'user' | 'assistant'}
                    content={getMessageText(message)}
                    isStreaming={isLoading && message === messages[messages.length - 1]}
                  />
                ))}
                {error && (
                  <div className="px-4 py-6">
                    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                      ⚠️ Erro ao enviar mensagem. Tente novamente.
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <ChatInput
            onSend={handleSend}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
