/**
 * Testa o mapeamento de órgãos para elementos
 */

const ELEMENTO_MAP: Record<string, string> = {
  // TERRA (土 - Tǔ)
  'BAÇO': 'TERRA',
  'BACO': 'TERRA',
  'ESTOMAGO': 'TERRA',
  'ESTÔMAGO': 'TERRA',
  'PÂNCREAS': 'TERRA',
  'PANCREAS': 'TERRA',
  
  // METAL (金 - Jīn)
  'PULMÃO': 'METAL',
  'PULMAO': 'METAL',
  'INTESTINO GROSSO': 'METAL',
  'INTESTINO-GROSSO': 'METAL',
  
  // ÁGUA (水 - Shuǐ)
  'RIM': 'ÁGUA',
  'RINS': 'ÁGUA',
  'BEXIGA': 'ÁGUA',
  'AGUA': 'ÁGUA',
  
  // MADEIRA (木 - Mù)
  'FÍGADO': 'MADEIRA',
  'FIGADO': 'MADEIRA',
  'VESÍCULA': 'MADEIRA',
  'VESÍCULA BILIAR': 'MADEIRA',
  'VESICULA': 'MADEIRA',
  'VESICULA BILIAR': 'MADEIRA',
  
  // FOGO (火 - Huǒ)
  'CORAÇÃO': 'FOGO',
  'CORACAO': 'FOGO',
  'INTESTINO DELGADO': 'FOGO',
  'INTESTINO-DELGADO': 'FOGO',
}

function normalizeElemento(elemento: string | undefined | null): string {
  if (!elemento) return ''
  const upper = elemento.toUpperCase().trim()
  return ELEMENTO_MAP[upper] || elemento
}

console.log('🔍 Testando Mapeamento de Órgãos → Elementos\n')

const testCases = [
  // TERRA
  { input: 'BAÇO', expected: 'TERRA' },
  { input: 'baço', expected: 'TERRA' },
  { input: 'Estômago', expected: 'TERRA' },
  { input: 'pâncreas', expected: 'TERRA' },
  
  // METAL
  { input: 'PULMÃO', expected: 'METAL' },
  { input: 'pulmao', expected: 'METAL' },
  { input: 'Intestino Grosso', expected: 'METAL' },
  
  // ÁGUA
  { input: 'RIM', expected: 'ÁGUA' },
  { input: 'rins', expected: 'ÁGUA' },
  { input: 'Bexiga', expected: 'ÁGUA' },
  { input: 'AGUA', expected: 'ÁGUA' },
  
  // MADEIRA
  { input: 'FÍGADO', expected: 'MADEIRA' },
  { input: 'figado', expected: 'MADEIRA' },
  { input: 'Vesícula Biliar', expected: 'MADEIRA' },
  
  // FOGO
  { input: 'CORAÇÃO', expected: 'FOGO' },
  { input: 'coracao', expected: 'FOGO' },
  { input: 'Intestino Delgado', expected: 'FOGO' },
  
  // Já é elemento (não deve mudar)
  { input: 'TERRA', expected: 'TERRA' },
  { input: 'METAL', expected: 'METAL' },
  { input: 'ÁGUA', expected: 'ÁGUA' },
  { input: 'MADEIRA', expected: 'MADEIRA' },
  { input: 'FOGO', expected: 'FOGO' },
]

let passed = 0
let failed = 0

testCases.forEach(({ input, expected }) => {
  const result = normalizeElemento(input)
  const status = result === expected ? '✅' : '❌'
  
  if (result === expected) {
    passed++
  } else {
    failed++
    console.log(`${status} "${input}" → "${result}" (esperado: "${expected}")`)
  }
})

console.log(`\n📊 Resultados:`)
console.log(`   ✅ Passou: ${passed}/${testCases.length}`)
console.log(`   ❌ Falhou: ${failed}/${testCases.length}`)

if (failed === 0) {
  console.log('\n🎉 Todos os mapeamentos estão corretos!')
} else {
  console.log('\n⚠️  Há mapeamentos incorretos que precisam ser corrigidos.')
}

// Listar todos os elementos e seus órgãos
console.log('\n\n📚 Mapeamento Completo MTC:\n')

const porElemento: Record<string, string[]> = {
  'TERRA': [],
  'METAL': [],
  'ÁGUA': [],
  'MADEIRA': [],
  'FOGO': [],
}

Object.entries(ELEMENTO_MAP).forEach(([orgao, elemento]) => {
  if (porElemento[elemento]) {
    porElemento[elemento].push(orgao)
  }
})

Object.entries(porElemento).forEach(([elemento, orgaos]) => {
  console.log(`${elemento}:`)
  orgaos.forEach(orgao => console.log(`   - ${orgao}`))
  console.log()
})
