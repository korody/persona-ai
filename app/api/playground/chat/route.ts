/**
 * API Route: Playground Chat (sem debitar créditos)
 * POST /api/playground/chat
 * 
 * Para testes do avatar sem consumir créditos ou criar conversas
 */

import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { createAdminClient } from '@/lib/supabase/server'
import { 
  searchKnowledgeGeneric,
  formatKnowledgeContext
} from '@/lib/rag'

export const runtime = 'edge'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages, avatarSlug = 'mestre-ye' } = body

    console.log('📥 Playground API received:', {
      hasMessages: !!messages,
      isArray: Array.isArray(messages),
      messagesLength: messages?.length || 0,
      avatarSlug,
      bodyKeys: Object.keys(body)
    })

    // Validar mensagens
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Pegar token de autorização
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = await createAdminClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Buscar avatar
    const { data: avatar, error: avatarError } = await supabase
      .from('avatars')
      .select('*')
      .eq('slug', avatarSlug)
      .single()

    if (avatarError || !avatar) {
      return new Response('Avatar not found', { status: 404 })
    }

    // Pegar última mensagem do usuário
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()
    const userQuery = lastUserMessage?.content || ''

    // Buscar conhecimento relevante (RAG)
    let knowledgeContext = ''
    if (userQuery) {
      try {
        const knowledgeDocs = await searchKnowledgeGeneric(userQuery, avatar.id, { 
          matchCount: 5,
          matchThreshold: 0.4
        })
        
        console.log('📚 Knowledge search results:', {
          query: userQuery.substring(0, 50),
          resultsCount: knowledgeDocs?.length || 0,
          isArray: Array.isArray(knowledgeDocs)
        })
        
        if (knowledgeDocs && Array.isArray(knowledgeDocs) && knowledgeDocs.length > 0) {
          knowledgeContext = formatKnowledgeContext(knowledgeDocs)
        }
      } catch (error) {
        console.error('Error searching knowledge:', error)
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown',
          stack: error instanceof Error ? error.stack : undefined
        })
      }
    }

    // Montar prompt do sistema com conhecimento
    const systemPrompt = `${avatar.system_prompt || 'Você é um assistente útil.'}

${knowledgeContext ? `\n## Base de Conhecimento Relevante:\n${knowledgeContext}\n` : ''}

---
**IMPORTANTE:** Use APENAS as informações da Base de Conhecimento acima para responder. Se não houver informação relevante, seja honesto sobre isso.`

    console.log('🤖 Preparing to stream:', {
      hasSystemPrompt: !!systemPrompt,
      messagesCount: messages.length,
      messagesStructure: messages.map((m: any) => ({ 
        role: m.role, 
        hasContent: !!m.content,
        contentType: typeof m.content,
        contentPreview: m.content?.substring(0, 50)
      })),
      rawMessages: JSON.stringify(messages)
    })

    // Garantir que messages está no formato correto
    const formattedMessages = messages.map((m: any) => ({
      role: m.role,
      content: String(m.content || '')
    }))

    console.log('📨 Formatted messages:', JSON.stringify(formattedMessages))

    // Stream com AI (usando mensagens diretamente sem conversão)
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPrompt,
      messages: formattedMessages as any,
      temperature: 0.7,
    })

    return result.toTextStreamResponse()

  } catch (error) {
    console.error('Playground chat error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
