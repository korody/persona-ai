import {
  insertKnowledgeDirect,
  searchKnowledgeDirect,
  insertExampleDirect,
  searchExamplesDirect
} from '@/lib/rag/direct'

const AVATAR_ID = '4ba4ff39-823a-4aa9-a129-8f23fec2704d'

async function testDirectRag() {
  console.log('🧪 TESTANDO SISTEMA RAG COM SQL DIRETO\n')
  console.log('=' .repeat(70))
  console.log('\n1️⃣  Adicionando conhecimento de teste via SQL direto...\n')

  try {
    // Adicionar conhecimentos de teste
    const id1 = await insertKnowledgeDirect(
      AVATAR_ID,
      'Dor nas Costas - Elemento Água',
      `Segundo a Medicina Tradicional Chinesa, dores nas costas, especialmente na região lombar, 
estão relacionadas ao Elemento Água e aos rins. O rim na MTC não é apenas o órgão físico, 
mas representa toda a energia vital (Jing). Quando há deficiência de Qi dos rins, pode haver:
- Dor lombar crônica
- Sensação de frio na região lombar
- Fraqueza nas pernas
- Cansaço excessivo

Tratamento recomendado:
- Acupuntura nos pontos R3 (Taixi), R7 (Fuliu), VB25 (Jingmen)
- Moxabustão na região lombar
- Exercícios suaves como Tai Chi e Qi Gong
- Evitar alimentos frios e crus`,
      'manual',
      ['dor', 'costas', 'água', 'rins', 'lombar'],
      { element: 'água', organs: ['rins', 'bexiga'] }
    )
    console.log(`✅ Criado: "Dor nas Costas - Elemento Água" (ID: ${id1})`)

    const id2 = await insertKnowledgeDirect(
      AVATAR_ID,
      'Ansiedade e Elemento Madeira',
      `A ansiedade na MTC está fortemente ligada ao Elemento Madeira, especificamente ao Fígado.
O Fígado regula o fluxo suave do Qi pelo corpo. Quando bloqueado (Estagnação de Qi do Fígado):
- Ansiedade e irritabilidade
- Tensão muscular
- Suspiros frequentes
- Sensação de nó na garganta
- Insônia

Causas comuns:
- Estresse emocional prolongado
- Frustração reprimida
- Raiva não expressa

Tratamento:
- Acupuntura: F3 (Taichong), VB20 (Fengchi), VB34 (Yanglingquan)
- Chás: Camomila, Melissa, Passiflora
- Exercícios aeróbicos moderados
- Meditação e respiração`,
      'manual',
      ['ansiedade', 'madeira', 'fígado', 'estagnação', 'qi'],
      { element: 'madeira', organs: ['fígado', 'vesícula biliar'] }
    )
    console.log(`✅ Criado: "Ansiedade e Elemento Madeira" (ID: ${id2})`)

    const id3 = await insertKnowledgeDirect(
      AVATAR_ID,
      'Exercícios para Elemento Fogo - Coração',
      `O Elemento Fogo e o Coração são responsáveis pela circulação, mente e emoções.
Para fortalecer o Fogo e o Coração:

Exercícios Qi Gong recomendados:
1. "Abrir o Coração" (Zhang Kai Xin Fei)
   - Movimentos de abertura dos braços
   - Respiração profunda coordenada
   - Visualização de luz dourada no peito

2. "Massagear o Pericárdio"
   - Esfregar as palmas até aquecer
   - Massagem circular no centro do peito
   - Estimular PC6 (Neiguan) nos pulsos

3. "Bater o Tambor Celestial"
   - Estimula circulação
   - Acalma a mente (Shen)

Benefícios:
- Melhora circulação
- Reduz palpitações
- Equilibra emoções
- Melhora o sono`,
      'manual',
      ['exercícios', 'fogo', 'coração', 'qi gong'],
      { element: 'fogo', organs: ['coração', 'intestino delgado'] }
    )
    console.log(`✅ Criado: "Exercícios para Elemento Fogo - Coração" (ID: ${id3})`)

    console.log('\n2️⃣  Testando busca RAG via SQL direto...\n')

    // Testar buscas
    const queries = [
      'Estou com dor nas costas, o que fazer?',
      'Me sinto ansioso ultimamente',
      'Quais exercícios fortalecem o coração?'
    ]

    for (const query of queries) {
      console.log(`\n🔍 Query: "${query}"`)
      const results = await searchKnowledgeDirect(query, AVATAR_ID, 0.5, 3)
      
      if (results.length > 0) {
        results.forEach((result, i) => {
          console.log(`   ${i + 1}. ${result.title} (similaridade: ${(result.similarity * 100).toFixed(1)}%)`)
          console.log(`      ${result.content.substring(0, 100)}...`)
        })
      } else {
        console.log('   ⚠️  Nenhum resultado encontrado')
      }
    }

    console.log('\n3️⃣  Adicionando exemplo de conversa via SQL direto...\n')

    const exampleId = await insertExampleDirect(
      AVATAR_ID,
      'Tenho insônia há semanas, o que pode ser?',
      `A insônia pode estar relacionada a diferentes elementos. Vou te ajudar a identificar:

Se você também tem:
- Ansiedade, pensamentos acelerados → Elemento Madeira (Fígado)
- Palpitações, agitação → Elemento Fogo (Coração)
- Preocupação excessiva, digestão ruim → Elemento Terra (Baço)

Me conte: você sente mais ansiedade, palpitações ou preocupação?`,
      'diagnóstico',
      ['insônia', 'sono', 'diagnóstico']
    )
    console.log(`✅ Criado exemplo de conversa (ID: ${exampleId})`)

    // Buscar exemplos
    console.log('\n4️⃣  Buscando exemplos via SQL direto...\n')
    const examples = await searchExamplesDirect(AVATAR_ID, 3)
    
    if (examples.length > 0) {
      examples.forEach((ex, i) => {
        console.log(`   Exemplo ${i + 1}:`)
        console.log(`   Usuário: ${ex.user_message.substring(0, 60)}...`)
        console.log(`   Assistente: ${ex.assistant_response.substring(0, 60)}...`)
        console.log()
      })
    }

    console.log('=' .repeat(70))
    console.log('\n✅ TESTE COMPLETO COM SQL DIRETO BEM-SUCEDIDO!')
    console.log('\n💡 Agora você pode usar as funções em lib/rag/direct.ts')
    console.log('   enquanto o cache do PostgREST não atualizar.\n')

  } catch (error) {
    console.error('\n❌ Erro no teste:', error)
  }
}

testDirectRag()
