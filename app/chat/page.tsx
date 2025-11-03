'use client'

import { useState, useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport } from 'ai'
import { Header } from '@/components/header'
import { ChatMessage } from '@/components/chat-message'
import { ChatInput } from '@/components/chat-input'
import { ConversationsSidebar } from '@/components/conversations-sidebar'
import { useCredits } from '@/hooks/use-credits'
import { useConversations } from '@/hooks/use-conversations'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare } from 'lucide-react'

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
  const { mutate: mutateCredits } = useCredits()
  const { mutate: mutateConversations } = useConversations()
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const chat = useChat({
    transport: new TextStreamChatTransport({
      api: '/api/chat',
      async headers() {
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

  // Se não temos conversationId mas temos mensagens, buscar o ID da conversa recém-criada
  useEffect(() => {
    if (!conversationId && messages.length >= 2) {
      // Após primeira mensagem completa, tentar buscar a última conversa
      const fetchLatestConversation = async () => {
        try {
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
  }, [conversationId, messages.length, supabase])

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
        <ConversationsSidebar 
          onNewConversation={handleNewConversation}
          onSelectConversation={handleSelectConversation}
          currentConversationId={conversationId}
        />

        <div className="flex flex-1 flex-col">
          {/* Status Bar */}
          {messages.length > 0 && (
            <div className="border-b px-4 py-2 bg-muted/10">
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  {conversationId ? (
                    <span>Conversa salva</span>
                  ) : (
                    <span>Nova conversa • Será salva ao enviar a primeira mensagem</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center max-w-md px-4">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-700">
                    <MessageSquare className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">
                    Olá! Sou o Mestre Ye
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Especialista em Medicina Tradicional Chinesa com mais de 30 anos de experiência. 
                    Como posso ajudá-lo hoje?
                  </p>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>💬 Pergunte sobre dores, sintomas ou desequilíbrios</p>
                    <p>🌳 Descubra qual elemento está desbalanceado</p>
                    <p>🧘 Receba exercícios personalizados do Método Ye Xin</p>
                  </div>
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