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
    courseId?: number
  } = {}
): Promise<Exercise[]> {
  const { matchCount = 3, courseId } = options

  const supabase = await createAdminClient()

  let query = supabase
    .from('hub_exercises')
    .select('*')
    .eq('is_active', true)
    .eq('element', quizLead.elemento_principal.toUpperCase())
    .order('position', { ascending: true })
    .limit(matchCount)

  if (courseId) {
    query = query.eq('memberkit_course_id', courseId.toString())
  }

  const { data: exercises, error } = await query
  
  if (error) {
    console.error('Error searching exercises by anamnese:', error)
    return []
  }
  
  return exercises || []
}

/**
 * Sintomas de uma parte do corpo → etiquetas usadas em hub_exercises.indications.
 * As etiquetas foram cadastradas com nomes variados (dor_joelho, dor_joelhos, joelho_fraco...),
 * então cada sintoma busca todas as variações.
 */
const BODY_PART_TAGS: Record<string, string[]> = {
  dor_joelho: ['dor_joelho', 'dor_joelhos', 'joelho_fraco'],
  dor_lombar: [
    'dor_lombar', 'dor_coluna', 'dor_costas', 'dor_lateral_costas', 'rigidez_costas',
    'rigidez_coluna', 'rigidez_lombar', 'tensão_lombar', 'tensão_costas', 'má_postura',
  ],
  dor_pescoço: ['dor_pescoço', 'dor_cervical', 'tensão_cervical', 'tensão_pescoço'],
  dor_ombro: ['dor_ombro', 'dor_ombros', 'tensão_ombros'],
  dor_quadril: ['dor_quadril', 'rigidez_quadril'],
  dor_braços: [
    'dor_braços', 'dor_mãos', 'dor_punhos', 'túnel_carpo', 'tendinite', 'fraqueza_mãos', 'fraqueza_braços',
  ],
  dor_cabeça: ['dor_cabeça'],
}

/** Variações de etiqueta para os demais sintomas */
const SYMPTOM_TAG_ALIASES: Record<string, string[]> = {
  ansiedade: ['ansiedade', 'estresse', 'nervosismo', 'agitação', 'preocupação', 'ansiedade_grave', 'ansiedade_extrema', 'pânico'],
  insônia: [
    'insônia', 'insônia_crônica', 'insônia_grave', 'dificuldade_dormir', 'sono_leve',
    'sono_interrompido', 'despertar_noturno', 'sono_não_reparador',
  ],
  fadiga: ['fadiga', 'cansaço', 'fadiga_crônica', 'fadiga_extrema', 'esgotamento', 'falta_energia'],
  energia_baixa: ['energia_baixa', 'falta_energia', 'falta_vontade'],
  digestão: ['digestão', 'má_digestão', 'digestão_fraca', 'gases', 'constipação'],
  pressão_alta: ['pressão_alta', 'hipertensão', 'palpitação'],
  zumbido: ['zumbido', 'labirintite', 'tontura', 'vertigem', 'audição_fraca'],
  respiração: ['respiração', 'respiração_curta', 'asma', 'asma_leve', 'bronquite', 'tosse', 'pulmão_fraco'],
  tristeza: ['tristeza', 'melancolia', 'depressão'],
  raiva: ['raiva', 'irritação', 'impaciência'],
  falta_foco: ['falta_foco', 'falta_concentração', 'dispersão', 'mente_agitada', 'memória_fraca'],
  imunidade: ['imunidade', 'imunidade_baixa'],
  desequilíbrio_hormonal: ['menopausa', 'menstruação'],
}

/** Sintomas genéricos: só desempatam, nunca passam na frente de uma queixa específica */
const GENERIC_SYMPTOMS = new Set(['rigidez', 'fadiga', 'energia_baixa', 'prática_diária'])

function tagsForSymptom(symptom: string): string[] {
  return BODY_PART_TAGS[symptom] ?? SYMPTOM_TAG_ALIASES[symptom] ?? [symptom]
}

/**
 * Busca exercícios por sintomas/indicações específicas, ordenados por relevância.
 * Se a mensagem cita uma parte do corpo, só entram exercícios dessa parte
 * (um exercício de costas marcado com "rigidez" não serve para "joelho duro").
 */
export async function searchExercisesBySymptoms(
  symptoms: string[],
  options: {
    matchCount?: number
    courseId?: number
  } = {}
): Promise<Exercise[]> {
  const { matchCount = 3, courseId } = options

  const supabase = await createAdminClient()

  const bodySymptoms = symptoms.filter(s => s in BODY_PART_TAGS)
  const bodyTags = new Set(bodySymptoms.flatMap(tagsForSymptom))
  const specificTags = new Set(
    symptoms.filter(s => !(s in BODY_PART_TAGS) && !GENERIC_SYMPTOMS.has(s)).flatMap(tagsForSymptom)
  )
  const genericTags = new Set(symptoms.filter(s => GENERIC_SYMPTOMS.has(s)).flatMap(tagsForSymptom))
  const allTags = [...new Set([...bodyTags, ...specificTags, ...genericTags])]

  let query = supabase
    .from('hub_exercises')
    .select('*')
    .eq('is_active', true)
    .overlaps('indications', allTags)
    .order('position', { ascending: true })
    .limit(200)

  if (courseId) {
    query = query.eq('memberkit_course_id', courseId.toString())
  }

  const { data: exercises, error } = await query

  if (error) {
    console.error('Error searching exercises by symptoms:', error)
    return []
  }

  const count = (tags: string[], set: Set<string>) => tags.filter(t => set.has(t)).length

  return (exercises || [])
    .map((exercise: Exercise) => {
      const tags = exercise.indications ?? []
      const bodyMatches = count(tags, bodyTags)
      return {
        exercise,
        bodyMatches,
        score: bodyMatches * 10 + count(tags, specificTags) * 3 + count(tags, genericTags),
      }
    })
    .filter(r => (bodyTags.size > 0 ? r.bodyMatches > 0 : r.score > 0))
    .sort((a, b) => b.score - a.score) // sort estável: empates mantêm a ordem por position
    .slice(0, matchCount)
    .map(r => r.exercise)
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
    courseId?: number
  } = {}
): Promise<Exercise[]> {
  const { matchCount = 5, matchThreshold = 0.7, courseId } = options

  try {
    console.log(`🧠 Generating embedding for query: "${query}"`)
    const supabase = await createAdminClient()

    const queryEmbedding = await generateQueryEmbedding(query)
    console.log(`✅ Embedding generated (${queryEmbedding.length} dimensions)`)

    const { data: exercises, error } = await supabase.rpc('match_exercises', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: courseId ? matchCount * 3 : matchCount, // Busca mais para filtrar depois
    })

    if (error) {
      console.error('❌ Error searching exercises by semantic:', error)
      throw error
    }

    let results = exercises || []

    // Filtrar por curso após busca semântica (RPC não suporta filtro direto)
    if (courseId && results.length > 0) {
      results = results
        .filter((e: Exercise) => e.memberkit_course_id === courseId.toString())
        .slice(0, matchCount)
    }

    console.log(`✅ Semantic search returned ${results.length} exercises${courseId ? ` (filtered by course ${courseId})` : ''}`)
    if (results.length > 0) {
      console.log(`   Top result: ${results[0].title}`)
    }
    return results
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
  exercises: (Exercise & { academy_locked?: boolean })[],
  quizLead?: QuizLead,
  avatarSlug?: string,
  origin: 'digital' | 'academy' = 'digital'
): Promise<string> {
  const fromAcademy = origin === 'academy'
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
  
  // Na AcadeMY não há links de venda externos: o próprio link do curso mostra como liberar.
  if (avatarSlug && uniqueCourseIds.size > 0 && !fromAcademy) {
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
    
    if (fromAcademy && exercise.academy_locked) {
      context += `   - Acesso: a aluna AINDA NÃO TEM este curso liberado na AcadeMY (o link mostra como liberar)\n`
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
  if (fromAcademy) {
    context += '   A aluna está usando o Mestre Ye Digital DENTRO DA ACADEMY (academy.mestreye.com): use só os links da AcadeMY acima, NUNCA links do MemberKit (memberkit.com.br). Quando o curso ainda não estiver liberado para ela, diga com delicadeza que está disponível na AcadeMY e que o link mostra como liberar.\n'
  }
  context += '3. Explique brevemente por que o exercício é adequado para o caso\n'
  context += '4. Mencione duração e nível de dificuldade quando relevante\n'
  context += '5. Só recomende um exercício se as "Indicações" dele correspondem à queixa da pessoa, inclusive à parte do corpo citada (joelho, costas, pescoço, ombro...). '
  context += 'NUNCA justifique um exercício de outra parte do corpo inventando ligações (meridianos, órgãos, elementos) que não estão na descrição dele. '
  context += 'Se nenhum exercício da lista servir para a queixa, diga com honestidade que não há um exercício específico indicado aqui e oriente de forma geral.\n\n'
  
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
      context += `Caso você ainda não tenha acesso a esses exercícios do ${productInfo.productName}, `
      context += `você pode adquirir através deste link: ${productInfo.salesUrl}. `
      context += `Caso tenha alguma dúvida sobre os produtos, fale com a Letícia do Comercial no Whatsapp: https://sendflow.pro/l/suporte-leticiawa\n\n`
    } else {
      context += `Caso você ainda não tenha acesso a esses exercícios, você pode adquirir os cursos através dos links abaixo. `
      context += `Caso tenha alguma dúvida sobre os produtos, fale com a Letícia do Comercial no Whatsapp: https://sendflow.pro/l/suporte-leticiawa\n\n`
      
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

  // Palavra inteira (aceitando plural): "dura" não casa com "durante", "joelho" casa com "joelhos"
  const matches = (keyword: string) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(?<!\\p{L})${escaped}s?(?!\\p{L})`, 'u').test(lowerMessage)
  }

  for (const [symptom, keywords] of Object.entries(symptomMap)) {
    if (keywords.some(matches)) {
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
    courseId?: number
  } = {}
): Promise<Exercise[]> {
  const { matchCount = 3, courseId } = options

  const supabase = await createAdminClient()

  let baseQuery = supabase
    .from('hub_exercises')
    .select('*')
    .eq('is_active', true)

  if (courseId) {
    baseQuery = baseQuery.eq('memberkit_course_id', courseId.toString()) as any
  }

  // Buscar primeiro por exercícios com indication prática_diária
  let { data: exercises, error } = await (baseQuery as any)
    .contains('indications', ['prática_diária'])
    .order('position', { ascending: true })
    .limit(matchCount)

  // Se não encontrou, buscar sequências completas ou introduções
  if (!exercises || exercises.length === 0) {
    let fallbackQuery = supabase
      .from('hub_exercises')
      .select('*')
      .eq('is_active', true)

    if (courseId) {
      fallbackQuery = fallbackQuery.eq('memberkit_course_id', courseId.toString()) as any
    }

    const result = await (fallbackQuery as any)
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
