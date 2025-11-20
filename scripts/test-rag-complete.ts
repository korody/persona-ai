/**
 * Teste rápido do sistema RAG completo
 */

import { generateEmbedding, searchKnowledge } from '../lib/rag'
import { createAdminClient } from '../lib/supabase/server'

async function testRAGSystem() {
  console.log('\n🧪 TESTANDO SISTEMA RAG COMPLETO\n')
  console.log('='.repeat(70))

  const AVATAR_ID = '4ba4ff39-823a-4aa9-a129-8f23fec2704d' // Mestre Ye

  try {
    // 1. Adicionar conhecimento de teste
    console.log('\n1️⃣ Adicionando conhecimento de teste...\n')
    
    const knowledgeEntries = [
      {
        title: 'Dor nas Costas - Elemento Água',
        content: 'Segundo a Medicina Tradicional Chinesa, dor nas costas pode estar relacionada ao desequilíbrio do Elemento Água, que governa os rins. Os rins armazenam a energia vital (Jing) e quando enfraquecidos, podem causar dor lombar. Recomenda-se exercícios específicos do Método Ye Xin para fortalecer o Elemento Água, como movimentos de rotação da cintura e alongamentos suaves da coluna.',
        tags: ['dor nas costas', 'elemento água', 'rins', 'lombar'],
        content_type: 'text',
      },
      {
        title: 'Ansiedade e Elemento Madeira',
        content: 'A ansiedade na MTC está frequentemente ligada ao desequilíbrio do Elemento Madeira, que rege o fígado. O fígado é responsável pelo fluxo suave do Qi (energia) pelo corpo. Quando bloqueado, pode causar ansiedade, irritabilidade e tensão muscular. Práticas de respiração profunda e movimentos de alongamento lateral ajudam a desbloquear o fígado.',
        tags: ['ansiedade', 'elemento madeira', 'fígado', 'qi'],
        content_type: 'text',
      },
      {
        title: 'Exercícios para Elemento Fogo - Coração',
        content: 'O Elemento Fogo governa o coração e está relacionado à alegria e conexão emocional. Exercícios para equilibrar o Fogo incluem movimentos de abertura do peito, rotações dos braços e práticas de meditação focadas no centro do peito. Recomenda-se praticar ao meio-dia, quando o Fogo está mais ativo.',
        tags: ['elemento fogo', 'coração', 'exercícios', 'método ye xin'],
        content_type: 'guidelines',
      },
    ]

    const supabase = await createAdminClient()

    for (const entry of knowledgeEntries) {
      const embedding = await generateEmbedding(entry.content)
      
      // Usar função RPC para inserir com embedding correto
      const { data, error } = await supabase.rpc('insert_knowledge_with_embedding', {
        p_avatar_id: AVATAR_ID,
        p_title: entry.title,
        p_content: entry.content,
        p_content_type: entry.content_type,
        p_tags: entry.tags,
        p_embedding_array: embedding,
      })

      if (error) {
        console.error(`❌ Erro ao criar "${entry.title}":`, error.message)
      } else {
        console.log(`✅ Criado: ${entry.title} (ID: ${data})`)
      }
    }

    // 2. Testar busca RAG
    console.log('\n2️⃣ Testando busca RAG...\n')
    
    const queries = [
      'Estou com dor nas costas, o que fazer?',
      'Me sinto ansioso ultimamente',
      'Quais exercícios fortalecem o coração?',
    ]

    for (const query of queries) {
      console.log(`\n🔍 Query: "${query}"`)
      const results = await searchKnowledge(query, AVATAR_ID, {
        matchCount: 2,
        matchThreshold: 0.4, // 40% similaridade mínima
      })

      if (results.length === 0) {
        console.log('   ⚠️  Nenhum resultado encontrado')
      } else {
        results.forEach((r, i) => {
          console.log(`   ${i + 1}. ${r.title} (${(r.similarity * 100).toFixed(1)}%)`)
          console.log(`      ${r.content?.substring(0, 100)}...`)
        })
      }
    }

    // 3. Adicionar exemplo de conversa
    console.log('\n3️⃣ Adicionando exemplo de conversa...\n')
    
    const { data: example, error: exError } = await supabase
      .from('avatar_conversation_examples')
      .insert({
        avatar_id: AVATAR_ID,
        user_message: 'Estou com insônia, não consigo dormir direito',
        assistant_response: 'A insônia na Medicina Tradicional Chinesa está relacionada ao desequilíbrio do coração e do baço. O coração abriga o Shen (espírito/mente), e quando desarmônico, causa dificuldade para dormir. Recomendo praticar exercícios suaves antes de dormir, focando em movimentos lentos que acalmam a mente. Também é importante evitar alimentos pesados à noite e criar uma rotina regular de sono.',
        category: 'sono',
        tags: ['insônia', 'coração', 'shen'],
        is_active: true,
        order_index: 1,
      })
      .select()
      .single()

    if (exError) {
      console.error('❌ Erro ao criar exemplo:', exError.message)
    } else {
      console.log('✅ Exemplo criado com sucesso!')
    }

    console.log('\n' + '='.repeat(70))
    console.log('\n✅ Teste concluído com sucesso!\n')

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error)
  }
}

// Executar
testRAGSystem().catch(console.error)
