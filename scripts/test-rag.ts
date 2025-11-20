// Script para testar o RAG - adiciona conhecimento de exemplo
// Execute com: npx tsx scripts/test-rag.ts

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { addKnowledge } from '../lib/ai/rag'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗')
  process.exit(1)
}

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Buscar avatar Mestre Ye
  const { data: avatar, error: avatarError } = await supabase
    .from('avatars')
    .select('id, name, slug')
    .eq('slug', 'mestre-ye')
    .single()

  if (avatarError || !avatar) {
    console.error('❌ Avatar não encontrado:', avatarError)
    return
  }

  console.log('✅ Avatar encontrado:', avatar.id, '-', avatar.name)

  // Exemplos de conhecimento para adicionar
  const knowledgeExamples = [
    {
      title: 'Dor nas Costas - Elemento Água',
      content: `Dores lombares segundo a Medicina Tradicional Chinesa estão relacionadas ao Elemento Água e aos Rins.

Sintomas comuns:
- Dor lombar crônica
- Sensação de frio nas costas
- Cansaço excessivo
- Problemas urinários

Exercícios recomendados do Método Ye Xin:
1. Massagem nos rins (região lombar) - 5 minutos
2. Alongamento da coluna deitado - 10 repetições
3. Respiração abdominal profunda - 10 minutos

Importante: Mantenha a região lombar aquecida e evite exposição ao frio.`,
      contentType: 'article',
      tags: ['dor-costas', 'elemento-agua', 'rim', 'lombar']
    },
    {
      title: 'Ansiedade e Elemento Madeira',
      content: `A ansiedade na MTC está frequentemente relacionada ao desequilíbrio do Elemento Madeira (Fígado e Vesícula Biliar).

Sintomas associados:
- Tensão muscular, especialmente ombros
- Irritabilidade
- Dificuldade para tomar decisões
- Insônia
- Dores de cabeça

Exercícios do Método Ye Xin para Elemento Madeira:
1. Torção de coluna sentado - 5 minutos cada lado
2. Alongamento lateral - 3 minutos cada lado
3. Respiração com expiração prolongada - 10 minutos
4. Automassagem no ponto Taichong (entre dedão e segundo dedo do pé)

Recomendação: Pratique ao ar livre, especialmente pela manhã.`,
      contentType: 'guide',
      tags: ['ansiedade', 'elemento-madeira', 'figado', 'tensao', 'insonia']
    },
    {
      title: 'Exercícios para Elemento Fogo - Coração',
      content: `O Elemento Fogo governa o Coração e a circulação. Quando desbalanceado, pode causar:

Sintomas:
- Palpitações
- Insônia
- Agitação mental
- Excesso de pensamentos

Exercícios específicos:
1. Meditação do Sorriso Interior - 15 minutos
   - Sente-se confortavelmente
   - Sorria levemente
   - Visualize energia calorosa no coração
   - Respire suavemente

2. Alongamento dos Braços (meridiano do coração)
   - Estenda os braços lateralmente
   - Palmas para cima
   - Mantenha 3 minutos

3. Respiração 4-7-8
   - Inspire 4 segundos
   - Segure 7 segundos
   - Expire 8 segundos
   - Repita 8 vezes

Melhor horário: 11h-13h (horário do Coração)`,
      contentType: 'exercise',
      tags: ['elemento-fogo', 'coracao', 'palpitacao', 'insonia', 'meditacao']
    }
  ]

  console.log('\n📚 Adicionando conhecimento...\n')

  for (const example of knowledgeExamples) {
    try {
      console.log(`➕ Adicionando: "${example.title}"`)
      
      const result = await addKnowledge(
        avatar.id,
        example.title,
        example.content,
        example.contentType,
        example.tags,
        null // created_by pode ser NULL
      )

      console.log(`✅ Adicionado com ID: ${result.id}`)
      console.log(`   Tags: ${example.tags.join(', ')}`)
      console.log('')
    } catch (error) {
      console.error(`❌ Erro ao adicionar "${example.title}":`, error)
    }
  }

  console.log('🎉 Conhecimento adicionado com sucesso!')
  console.log('\n📝 Próximo passo: Teste conversando com o Mestre Ye sobre:')
  console.log('   - "Estou com dor nas costas"')
  console.log('   - "Tenho ansiedade e tensão"')
  console.log('   - "Estou com insônia e palpitações"')
}

main().catch(console.error)
