/**
 * Exercise Recommendations Helper
 * Funções para buscar e formatar exercícios do Memberkit
 */

import { createAdminClient } from '@/lib/supabase/server'
import type { QuizLead } from '@/lib/types/anamnese'
import type { Exercise } from '@/lib/memberkit/types'
import { generateQueryEmbedding } from '@/lib/ai/embeddings'

/**
 * Busca exercícios relevantes baseados na anamnese do usuário
 */
export async function searchExercisesByAnamnese(
  quizLead: QuizLead,
  options: {
    matchCount?: number
  } = {}
): Promise<Exercise[]> {
  const { matchCount = 3 } = options
  
  const supabase = await createAdminClient()
  
  // Buscar por elemento principal
  const { data: exercises, error } = await supabase
    .from('hub_exercises')
    .select('*')
    .eq('is_active', true)
    
    .eq('element', quizLead.elemento_principal.toUpperCase())
    .order('position', { ascending: true })
    .limit(matchCount)
  
  if (error) {
    console.error('Error searching exercises by anamnese:', error)
    return []
  }
  
  return exercises || []
}

/**
 * Busca exercícios por sintomas/indicações específicas
 */
export async function searchExercisesBySymptoms(
  symptoms: string[],
  options: {
    matchCount?: number
  } = {}
): Promise<Exercise[]> {
  const { matchCount = 3 } = options
  
  const supabase = await createAdminClient()
  
  // Buscar exercícios que contenham qualquer dos sintomas nas indicações
  const { data: exercises, error } = await supabase
    .from('hub_exercises')
    .select('*')
    .eq('is_active', true)
    
    .overlaps('indications', symptoms)
    .limit(matchCount)
  
  if (error) {
    console.error('Error searching exercises by symptoms:', error)
    return []
  }
  
  return exercises || []
}

/**
 * Busca exercícios por elemento da MTC
 */
export async function searchExercisesByElement(
  element: string,
  options: {
    matchCount?: number
    level?: string
  } = {}
): Promise<Exercise[]> {
  const { matchCount = 3, level } = options
  
  const supabase = await createAdminClient()
  
  let query = supabase
    .from('hub_exercises')
    .select('*')
    .eq('is_active', true)
    
    .eq('element', element.toUpperCase())
    .order('position', { ascending: true })
  
  if (level) {
    query = query.eq('level', level.toUpperCase())
  }
  
  query = query.limit(matchCount)
  
  const { data: exercises, error } = await query
  
  if (error) {
    console.error('Error searching exercises by element:', error)
    return []
  }
  
  return exercises || []
}

/**
 * Busca exercícios usando busca semântica (AI-powered)
 * Encontra exercícios relevantes mesmo com linguagem natural
 */
export async function searchExercisesBySemantic(
  query: string,
  options: {
    matchCount?: number
    matchThreshold?: number
  } = {}
): Promise<Exercise[]> {
  const { matchCount = 5, matchThreshold = 0.7 } = options
  
  try {
    console.log(`🧠 Generating embedding for query: "${query}"`)
    const supabase = await createAdminClient()
    
    // 1. Gerar embedding da query do usuário
    const queryEmbedding = await generateQueryEmbedding(query)
    console.log(`✅ Embedding generated (${queryEmbedding.length} dimensions)`)
    
    // 2. Buscar exercícios similares usando RPC do Supabase
    const { data: exercises, error } = await supabase.rpc('match_exercises', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    })
    
    if (error) {
      console.error('❌ Error searching exercises by semantic:', error)
      throw error // Re-throw para o catch externo logar mais detalhes
    }
    
    console.log(`✅ Semantic search returned ${exercises?.length || 0} exercises`)
    if (exercises && exercises.length > 0) {
      console.log(`   Top result: ${exercises[0].title} (${(exercises[0].similarity * 100).toFixed(1)}%)`)
    }
    return exercises || []
  } catch (error) {
    console.error('Error in semantic search:', error)
    return []
  }
}

/**
 * Formata exercícios para incluir no contexto do sistema
 */
/**
 * Formata exercícios para incluir no contexto do sistema
 * Agora inclui informação de aquisição dos cursos via avatar_portfolio
 */
export async function formatExercisesContext(
  exercises: Exercise[],
  quizLead?: QuizLead,
  avatarSlug?: string
): Promise<string> {
  if (exercises.length === 0) {
    return ''
  }
  
  let context = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
  context += '🧘 EXERCÍCIOS RECOMENDADOS DO MÉTODO YE XIN\n'
  context += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n'
  
  if (quizLead) {
    context += `Com base no perfil do usuário (Elemento: ${quizLead.elemento_principal}, `
    context += `Intensidade: ${quizLead.intensidade_calculada}), recomendamos:\n\n`
  }
  
  // Agrupar exercícios por curso
  const exercisesByCourse = new Map<string, Exercise[]>()
  const uniqueCourseIds = new Set<string>()
  
  exercises.forEach(exercise => {
    const courseId = exercise.memberkit_course_id
    uniqueCourseIds.add(courseId)
    if (!exercisesByCourse.has(courseId)) {
      exercisesByCourse.set(courseId, [])
    }
    exercisesByCourse.get(courseId)!.push(exercise)
  })
  
  // Buscar informações de vendas dos cursos do avatar_portfolio
  const coursesSalesInfo = new Map<string, { productName: string, salesUrl: string }>()
  
  if (avatarSlug && uniqueCourseIds.size > 0) {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { data: products } = await supabase
        .from('avatar_portfolio')
        .select('memberkit_course_id, product_name, product_url')
        .eq('avatar_slug', avatarSlug)
        .in('memberkit_course_id', Array.from(uniqueCourseIds).map(id => parseInt(id)))
        .not('product_url', 'is', null)
      
      if (products) {
        products.forEach((p: any) => {
          coursesSalesInfo.set(p.memberkit_course_id.toString(), {
            productName: p.product_name,
            salesUrl: p.product_url
          })
        })
      }
    } catch (error) {
      console.error('Error fetching sales info:', error)
    }
  }
  
  // Listar exercícios
  let exerciseIndex = 1
  exercises.forEach((exercise) => {
    context += `${exerciseIndex}. **${exercise.title}**\n`
    
    if (exercise.element) {
      context += `   - Elemento: ${exercise.element}\n`
    }
    
    if (exercise.level) {
      context += `   - Nível: ${exercise.level}\n`
    }
    
    if (exercise.duration_minutes) {
      context += `   - Duração: ${exercise.duration_minutes} minutos\n`
    }
    
    if (exercise.benefits && exercise.benefits.length > 0) {
      context += `   - Benefícios: ${exercise.benefits.join(', ')}\n`
    }
    
    if (exercise.indications && exercise.indications.length > 0) {
      context += `   - Indicações: ${exercise.indications.join(', ')}\n`
    }
    
    if (exercise.description) {
      context += `   - Descrição: ${exercise.description}\n`
    }
    
    // Link clicável que abre em nova aba
    context += `   - 🔗 <a href="${exercise.url}" target="_blank" rel="noopener noreferrer">Acessar vídeo</a>\n\n`
    exerciseIndex++
  })
  
  context += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
  context += '⚠️ REGRA OBRIGATÓRIA SOBRE EXERCÍCIOS:\n'
  context += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n'
  context += 'SEMPRE que recomendar ou mencionar um exercício da lista acima:\n'
  context += '1. INCLUA o link do vídeo usando o formato: 🔗 [Nome do Exercício](URL_DO_VIDEO)\n'
  context += '2. Use o link EXATO fornecido acima (não invente URLs)\n'
  context += '3. Explique brevemente por que o exercício é adequado para o caso\n'
  context += '4. Mencione duração e nível de dificuldade quando relevante\n\n'
  
  // Adicionar informação de aquisição por curso
  if (coursesSalesInfo.size > 0) {
    context += '**INFORMAÇÃO DE ACESSO AOS CURSOS:**\n'
    context += 'Ao final da sua resposta, quando recomendar exercícios, adicione esta mensagem:\n\n'
    
    const coursesWithSales: string[] = []
    coursesSalesInfo.forEach((info, courseId) => {
      const exercises = exercisesByCourse.get(courseId) || []
      coursesWithSales.push(`"${info.productName}": ${info.salesUrl}`)
    })
    
    if (coursesWithSales.length === 1) {
      const [productInfo] = Array.from(coursesSalesInfo.values())
      context += `"Caso você ainda não tenha acesso a esses exercícios do ${productInfo.productName}, `
      context += `você pode adquirir através deste link: ${productInfo.salesUrl}. `
      context += `Caso tenha alguma dúvida sobre os produtos, fale com a Letícia do Comercial no Whatsapp: https://sendflow.pro/l/suporte-leticiawa"\n\n`
    } else {
      context += `"Caso você ainda não tenha acesso a esses exercícios, você pode adquirir os cursos através dos links abaixo. `
      context += `Caso tenha alguma dúvida sobre os produtos, fale com a Letícia do Comercial no Whatsapp: https://sendflow.pro/l/suporte-leticiawa"\n\n`
      
      coursesSalesInfo.forEach((info, courseId) => {
        const courseExercises = exercisesByCourse.get(courseId) || []
        context += `- ${info.productName}: ${info.salesUrl} (${courseExercises.length} exercício${courseExercises.length > 1 ? 's' : ''})\n`
      })
    }
  }
  
  return context
}

/**
 * Extrai sintomas da mensagem do usuário para buscar exercícios
 */
export function extractSymptomsFromMessage(message: string): string[] {
  const symptomMap: Record<string, string[]> = {
    // ANSIEDADE E ESTRESSE (expandido)
    'ansiedade': [
      'ansiedade', 'ansioso', 'ansiosa', 'nervosismo', 'nervoso', 'nervosa',
      'preocupação', 'preocupado', 'estresse', 'estressado', 'estressada',
      'agitação', 'agitado', 'inquieto', 'tensão', 'tenso', 'tensa',
      'aflição', 'aflito', 'angústia', 'angustiado', 'pânico'
    ],
    
    // SONO E INSÔNIA (expandido)
    'insônia': [
      'insônia', 'dificuldade para dormir', 'não consigo dormir', 'sono ruim',
      'sono leve', 'acorda muito', 'despertar noturno', 'dormir mal',
      'não durmo', 'mal dormido', 'sono agitado', 'pesadelos'
    ],
    
    // DOR LOMBAR E COLUNA (expandido)
    'dor_lombar': [
      'dor na lombar', 'dor nas costas', 'lombar', 'coluna', 'dor lombar',
      'dor de coluna', 'costas doendo', 'dor nas costas', 'lombalgia',
      'travado', 'trava', 'coluna travada', 'costas travadas'
    ],
    
    // DOR PESCOÇO (expandido)
    'dor_pescoço': [
      'dor no pescoço', 'cervical', 'torcicolo', 'pescoço travado',
      'pescoço doendo', 'dor cervical', 'rigidez pescoço', 'pescoço duro'
    ],
    
    // DOR OMBRO (expandido)
    'dor_ombro': [
      'dor no ombro', 'ombro', 'ombros doendo', 'ombro travado',
      'ombro tenso', 'tensão ombro', 'bursite', 'ombro congelado'
    ],
    
    // DOR JOELHO (expandido)
    'dor_joelho': [
      'dor no joelho', 'joelho', 'joelhos doendo', 'joelho fraco',
      'joelho inchado', 'artrose', 'artrite joelho'
    ],
    
    // FADIGA E CANSAÇO (expandido)
    'fadiga': [
      'fadiga', 'cansaço', 'exaustão', 'cansado', 'cansada', 'exausto', 'exausta',
      'sem energia', 'desanimado', 'desânimo', 'fraqueza', 'fraco', 'fraca',
      'esgotado', 'esgotamento', 'falta de energia', 'sem disposição'
    ],
    
    // ENERGIA BAIXA (novo)
    'energia_baixa': [
      'sem energia', 'energia baixa', 'desanimado', 'sem disposição',
      'sem vontade', 'letargia', 'moleza', 'prostração', 'abatido'
    ],
    
    // DIGESTÃO (expandido)
    'digestão': [
      'digestão', 'estômago', 'má digestão', 'indigestão', 'azia',
      'queimação', 'estufamento', 'inchaço', 'empachado', 'gases',
      'intestino preso', 'constipação', 'diarreia', 'refluxo'
    ],
    
    // PRESSÃO E CIRCULAÇÃO (expandido)
    'pressão_alta': [
      'pressão alta', 'hipertensão', 'pressão', 'palpitação',
      'coração acelerado', 'taquicardia'
    ],
    
    // ZUMBIDO E AUDIÇÃO (expandido)
    'zumbido': [
      'zumbido', 'ouvido', 'tinitus', 'chiado no ouvido', 'apito no ouvido',
      'labirintite', 'tontura', 'vertigem', 'enjoo'
    ],
    
    // DOR DE CABEÇA (expandido)
    'dor_cabeça': [
      'dor de cabeça', 'enxaqueca', 'cefaleia', 'cabeça doendo',
      'cabeça latejando', 'dor na cabeça', 'cabeça pesada'
    ],
    
    // DOR BRAÇOS E MÃOS (novo)
    'dor_braços': [
      'dor nos braços', 'dor nas mãos', 'braços doendo', 'mãos doendo',
      'formigamento', 'dormência', 'túnel do carpo', 'tendinite',
      'LER', 'punho doendo', 'dor punho'
    ],
    
    // RESPIRAÇÃO (novo)
    'respiração': [
      'falta de ar', 'dificuldade respirar', 'respiração curta',
      'sufocamento', 'asma', 'bronquite', 'pulmão', 'tosse'
    ],
    
    // RIGIDEZ E FLEXIBILIDADE (novo)
    'rigidez': [
      'rigidez', 'rígido', 'rígida', 'duro', 'dura', 'encurtado',
      'sem flexibilidade', 'não consigo alongar', 'corpo travado',
      'articulações duras', 'enrijecido'
    ],
    
    // EMOÇÕES NEGATIVAS (novo)
    'tristeza': [
      'tristeza', 'triste', 'depressão', 'deprimido', 'melancolia',
      'choro fácil', 'sensível', 'emotivo', 'angústia'
    ],
    
    'raiva': [
      'raiva', 'irritação', 'irritado', 'irritada', 'bravo', 'brava',
      'nervoso', 'estressado', 'impaciente', 'frustrado', 'frustração'
    ],
    
    // CONCENTRAÇÃO E FOCO (novo)
    'falta_foco': [
      'falta de foco', 'disperso', 'dispersão', 'falta concentração',
      'desatento', 'mente agitada', 'pensamento acelerado',
      'não consigo focar', 'esquecimento', 'memória fraca'
    ],
    
    // DOR QUADRIL (novo)
    'dor_quadril': [
      'dor no quadril', 'quadril', 'virilha', 'dor na virilha',
      'quadril travado', 'dor ciático', 'ciática'
    ],
    
    // SISTEMA IMUNE (novo)
    'imunidade': [
      'imunidade baixa', 'fico doente', 'gripe', 'resfriado',
      'infecções', 'defesa baixa', 'resistência baixa'
    ],
    
    // INCHAÇO (novo)
    'inchaço': [
      'inchaço', 'inchado', 'retenção', 'retenção líquido',
      'edema', 'pernas inchadas', 'pés inchados'
    ],
    
    // MENOPAUSA/HORMONAL (novo)
    'desequilíbrio_hormonal': [
      'menopausa', 'fogacho', 'ondas de calor', 'suor noturno',
      'TPM', 'cólica', 'irregularidade menstrual'
    ],
    
    // Termos genéricos que indicam interesse em praticar
    'prática_diária': [
      'praticar', 'começar', 'iniciar', 'curso', 'video', 'vídeo',
      'exercício', 'aula', 'treino', 'me ensina', 'me passa',
      'quero aprender', 'como fazer', 'rotina', 'prática'
    ]
  }
  
  const lowerMessage = message.toLowerCase()
  const foundSymptoms: string[] = []
  
  for (const [symptom, keywords] of Object.entries(symptomMap)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      foundSymptoms.push(symptom)
    }
  }
  
  return foundSymptoms
}

/**
 * Verifica se a mensagem é um pedido genérico de exercícios
 */
export function isGenericExerciseRequest(message: string): boolean {
  const genericKeywords = [
    'curso', 'video', 'vídeo', 'exercício', 'exercicio', 
    'aula', 'praticar', 'começar', 'iniciar', 'me ensina',
    'me mostra', 'me passa'
  ]
  
  const lowerMessage = message.toLowerCase()
  return genericKeywords.some(keyword => lowerMessage.includes(keyword))
}

/**
 * Busca exercícios introdutórios para iniciantes
 */
export async function searchIntroductoryExercises(
  options: {
    matchCount?: number
  } = {}
): Promise<Exercise[]> {
  const { matchCount = 3 } = options
  
  const supabase = await createAdminClient()
  
  // Buscar primeiro por exercícios com indication prática_diária
  let { data: exercises, error } = await supabase
    .from('hub_exercises')
    .select('*')
    .eq('is_active', true)
    
    .contains('indications', ['prática_diária'])
    .order('position', { ascending: true })
    .limit(matchCount)
  
  // Se não encontrou, buscar sequências completas ou introduções
  if (!exercises || exercises.length === 0) {
    const result = await supabase
      .from('hub_exercises')
      .select('*')
      .eq('is_active', true)
      
      .or('title.ilike.%sequência completa%,title.ilike.%introdução%')
      .limit(matchCount)
    
    exercises = result.data
    error = result.error
  }
  
  if (error) {
    console.error('Error searching introductory exercises:', error)
    return []
  }
  
  return exercises || []
}
