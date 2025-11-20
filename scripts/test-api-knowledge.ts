/**
 * Teste RAG via API HTTP
 */

const AVATAR_ID = '4ba4ff39-823a-4aa9-a129-8f23fec2704d' // Mestre Ye
const BASE_URL = 'http://localhost:3002'

async function testViaAPI() {
  console.log('\n🧪 TESTANDO RAG VIA API HTTP\n')
  console.log('='.repeat(70))

  // 1. Adicionar conhecimento
  console.log('\n1️⃣  Adicionando conhecimento via API...\n')

  const knowledge = [
    {
      title: 'Dor nas Costas - Elemento Água',
      content: `Segundo a MTC, dores nas costas relacionam-se ao Elemento Água e aos rins. 
O rim armazena energia vital (Jing). Deficiência de Qi dos rins causa:
- Dor lombar crônica
- Sensação de frio na lombar
- Fraqueza nas pernas
- Cansaço excessivo

Tratamento: Acupuntura R3, R7, VB25. Moxabustão lombar. Tai Chi e Qi Gong.`,
      content_type: 'manual',
      tags: ['dor', 'costas', 'água', 'rins'],
    },
    {
      title: 'Ansiedade - Elemento Madeira',
      content: `Ansiedade na MTC liga-se ao Elemento Madeira (Fígado).
Fígado regula fluxo de Qi. Estagnação causa:
- Ansiedade e irritabilidade
- Tensão muscular
- Suspiros frequentes
- Nó na garganta
- Insônia

Tratamento: Acupuntura F3, VB20, VB34. Chás de camomila e melissa.`,
      content_type: 'manual',
      tags: ['ansiedade', 'madeira', 'fígado'],
    },
  ]

  for (const item of knowledge) {
    try {
      const res = await fetch(`${BASE_URL}/api/avatar-training/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_id: AVATAR_ID, ...item }),
      })

      if (res.ok) {
        const data = await res.json()
        console.log(`✅ ${item.title}`)
        console.log(`   ID: ${data.knowledge.id}`)
        console.log(`   Embedding: ${data.knowledge.embedding ? '✅ Gerado' : '❌ Faltando'}`)
      } else {
        const error = await res.json()
        console.log(`❌ ${item.title}: ${error.error}`)
      }
    } catch (err: any) {
      console.log(`❌ ${item.title}: ${err.message}`)
    }
  }

  // Aguardar um pouco
  console.log('\n⏳ Aguardando 2 segundos...\n')
  await new Promise(resolve => setTimeout(resolve, 2000))

  // 2. Listar conhecimento
  console.log('2️⃣  Listando conhecimento do avatar...\n')

  try {
    const res = await fetch(`${BASE_URL}/api/avatar-training/knowledge?avatar_id=${AVATAR_ID}`)
    const data = await res.json()

    if (data.knowledge) {
      console.log(`✅ Encontrados ${data.knowledge.length} registros:`)
      data.knowledge.forEach((k: any, i: number) => {
        console.log(`   ${i + 1}. ${k.title}`)
        console.log(`      Embedding: ${k.embedding ? '✅ Presente' : '❌ Ausente'}`)
        console.log(`      Tags: ${k.tags?.join(', ') || 'nenhuma'}`)
      })
    }
  } catch (err: any) {
    console.log(`❌ Erro ao listar: ${err.message}`)
  }

  console.log('\n' + '='.repeat(70))
  console.log('✅ Teste concluído!\n')
}

testViaAPI()
