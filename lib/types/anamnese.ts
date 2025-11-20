/**
 * Types para Anamnese e Quiz MTC
 */

export interface QuizLead {
  id: string
  email: string
  nome: string
  telefone: string
  
  // Diagnóstico MTC
  elemento_principal: 'RIM' | 'FÍGADO' | 'BAÇO' | 'CORAÇÃO' | 'PULMÃO'
  contagem_elementos: {
    RIM: number
    FÍGADO: number
    BAÇO: number
    CORAÇÃO: number
    PULMÃO: number
  }
  codigo_perfil: string
  nome_perfil: string
  arquetipo: string
  quadrante: 1 | 2 | 3 | 4
  diagnostico_resumo: string
  
  // Scoring
  lead_score: number
  prioridade: 'ALTA' | 'MÉDIA' | 'BAIXA'
  is_hot_lead_vip: boolean
  intensidade_calculada: number
  urgencia_calculada: number
  
  // Sintomas
  sintomas_marcados?: string[]
  elementos_scores?: Record<string, number>
  
  // Timestamps
  created_at: string
  updated_at: string
}

export interface AnamneseSearchResult {
  id: string
  content: string
  similarity: number
  elemento: string | null
  is_primary: boolean
  is_secondary: boolean
  metadata: {
    elemento?: string
    sintomas_relacionados?: string[]
    tipo_conteudo?: string
    nivel_severidade?: string[]
  }
}

export interface AnamneseContext {
  hasAnamnese: boolean
  data?: QuizLead
  elementoPrincipal?: string
  elementosSecundarios?: string[]
  intensidade?: number
  urgencia?: number
}
