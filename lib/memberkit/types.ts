/**
 * Memberkit Types
 * Tipos para integração com Memberkit
 */

// ============================================
// 1. RESPOSTA API MEMBERKIT
// ============================================

export interface MemberkitLesson {
  id: string
  title: string
  slug: string
  position: number
  type?: 'video' | 'text' | 'quiz' | 'download'
  duration_seconds?: number
  is_published?: boolean
  url?: string
}

export interface MemberkitSection {
  id: string
  name: string
  position: number
  lessons: MemberkitLesson[]
}

export interface MemberkitCourse {
  id: string
  name: string
  description: string
  slug?: string
  is_published?: boolean
  sections: MemberkitSection[]
  created_at?: string
  updated_at?: string
}

// ============================================
// 2. ENUMS
// ============================================

export enum ExerciseLevel {
  INICIANTE = 'INICIANTE',
  INTERMEDIÁRIO = 'INTERMEDIÁRIO',
  AVANÇADO = 'AVANÇADO'
}

export enum MTCElement {
  METAL = 'METAL',
  ÁGUA = 'ÁGUA',
  MADEIRA = 'MADEIRA',
  FOGO = 'FOGO',
  TERRA = 'TERRA'
}

export enum MTCOrgan {
  // Metal
  PULMÃO = 'PULMÃO',
  INTESTINO_GROSSO = 'INTESTINO_GROSSO',
  
  // Água
  RIM = 'RIM',
  BEXIGA = 'BEXIGA',
  
  // Madeira
  FÍGADO = 'FÍGADO',
  VESÍCULA_BILIAR = 'VESÍCULA_BILIAR',
  
  // Fogo
  CORAÇÃO = 'CORAÇÃO',
  INTESTINO_DELGADO = 'INTESTINO_DELGADO',
  
  // Terra
  BAÇO = 'BAÇO',
  ESTÔMAGO = 'ESTÔMAGO'
}

// ============================================
// 3. TABELA SUPABASE - EXERCICIOS
// ============================================

export interface Exercise {
  id: string
  
  // Memberkit data (source)
  memberkit_course_id: string
  memberkit_course_slug: string
  memberkit_section_id: string
  memberkit_lesson_id: string
  
  // Basic information
  title: string
  description: string | null
  slug: string
  url: string
  
  // MTC classification
  element: MTCElement | null
  organs: MTCOrgan[] | null
  
  // Exercise details
  duration_minutes: number | null
  level: ExerciseLevel | null
  
  // Tags and search
  tags: string[] | null
  benefits: string[] | null
  indications: string[] | null
  contraindications: string[] | null
  
  // Embedding for semantic search
  embedding: number[] | null
  
  // Control
  is_active: boolean
  position: number
  
  // Timestamps
  created_at: string
  updated_at: string
}

// Type for insertion (without auto-generated fields)
export type ExerciseInsert = Omit<Exercise, 'id' | 'created_at' | 'updated_at'>

// Type for update (all fields optional except id)
export type ExerciseUpdate = Partial<Omit<Exercise, 'id'>>

// ============================================
// 4. METADATA (exercicios-metadata.json)
// ============================================

export interface ExerciseMetadata {
  // MTC classification
  element?: MTCElement
  organs?: MTCOrgan[]
  
  // Details
  duration_minutes?: number
  level?: ExerciseLevel
  
  // Descriptive tags
  tags?: string[]
  benefits?: string[]
  indications?: string[]
  contraindications?: string[]
}

export type ExercisesMetadataMap = Record<string, ExerciseMetadata>

// Structure of exercicios-metadata.json file
export interface ExercisesMetadataFile {
  version: string
  lastSync: string | null
  exercicios: ExercisesMetadataMap
}

// ============================================
// 5. RESPONSE AND SEARCH TYPES
// ============================================

export interface ExerciseSearchResult extends Exercise {
  similarity_score?: number
  match_reason?: 'element' | 'organ' | 'benefit' | 'semantic'
}

export interface ExerciseSearchParams {
  query?: string
  element?: MTCElement
  organs?: MTCOrgan[]
  level?: ExerciseLevel
  tags?: string[]
  limit?: number
  threshold?: number
}
