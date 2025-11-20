/**
 * Types para o sistema de treinamento de avatares
 */

export interface KnowledgeBase {
  id: string
  avatar_id: string
  title: string
  content: string
  content_type: 'text' | 'qa' | 'guidelines' | 'document'
  embedding?: number[]
  tags: string[]
  is_active: boolean
  file_url?: string
  file_type?: 'pdf' | 'docx' | 'txt' | 'manual'
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  created_by?: string
}

export interface KnowledgeChunk {
  id: string
  knowledge_base_id: string
  avatar_id: string
  content: string
  embedding: number[]
  chunk_index: number
  token_count?: number
  metadata?: Record<string, any>
  created_at: string
}

export interface ConversationExample {
  id: string
  avatar_id: string
  user_message: string
  assistant_response: string
  tags: string[]
  category?: string
  is_active: boolean
  order_index: number
  created_at: string
  updated_at: string
  created_by?: string
}

export interface PromptVersion {
  id: string
  avatar_id: string
  version: string
  system_prompt: string
  personality_config: PersonalityConfig
  model_config: ModelConfig
  is_active: boolean
  notes?: string
  created_at: string
  created_by?: string
}

export interface PersonalityConfig {
  formality: number // 0-100
  empathy: number // 0-100
  emoji_usage: number // 0-100
  response_length: 'short' | 'medium' | 'long'
  tone: 'serious' | 'friendly' | 'encouraging' | 'professional'
  features: {
    use_quiz_context: boolean
    recommend_exercises: boolean
    mention_products: boolean
    ask_followup_questions: boolean
  }
}

export interface ModelConfig {
  model: string
  temperature: number // 0.0 - 1.0
  max_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
}

export interface UserMemory {
  id: string
  user_id: string
  avatar_id: string
  key: string
  value: string
  confidence: number // 0.0 - 1.0
  source: 'quiz' | 'conversation' | 'manual'
  conversation_id?: string
  extracted_at: string
  updated_at: string
}

export interface UserCommunicationPreferences {
  id: string
  user_id: string
  avatar_id: string
  preferred_response_length: 'short' | 'medium' | 'long'
  preferred_formality: number // 0-100
  prefers_emojis: boolean
  prefers_examples: boolean
  prefers_questions: boolean
  language: string
  created_at: string
  updated_at: string
}

export interface ConversationFeedback {
  id: string
  conversation_id: string
  message_id: string
  user_id: string
  rating: 1 | 2 | 3 | 4 | 5
  feedback_type: 'thumbs_up' | 'thumbs_down' | 'report'
  feedback_text?: string
  tags: string[]
  created_at: string
}

export interface LearnedPattern {
  id: string
  avatar_id: string
  pattern_type: 'common_question' | 'good_response' | 'user_confusion'
  pattern_content: Record<string, any>
  frequency: number
  avg_rating?: number
  status: 'pending' | 'approved' | 'rejected' | 'active'
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

export interface HighlightedConversation {
  id: string
  conversation_id: string
  avatar_id: string
  reason: 'high_rating' | 'interesting_topic' | 'good_example'
  notes?: string
  highlighted_by?: string
  created_at: string
}

// API Request/Response types

export interface UploadDocumentRequest {
  avatar_id: string
  title: string
  file: File
  tags?: string[]
  content_type?: string
}

export interface UploadDocumentResponse {
  knowledge_base_id: string
  status: 'processing' | 'completed' | 'error'
  chunks_created?: number
  message?: string
}

export interface AddExampleRequest {
  avatar_id: string
  user_message: string
  assistant_response: string
  tags?: string[]
  category?: string
}

export interface UpdatePromptRequest {
  avatar_id: string
  system_prompt: string
  personality_config: PersonalityConfig
  model_config: ModelConfig
  notes?: string
}

export interface TestAvatarRequest {
  avatar_id: string
  message: string
  use_rag?: boolean
  use_examples?: boolean
  use_memory?: boolean
  temperature?: number
}

export interface TestAvatarResponse {
  response: string
  sources_used?: Array<{
    title: string
    similarity: number
  }>
  examples_used?: number
  memory_used?: string[]
  metrics: {
    response_time_ms: number
    word_count: number
    estimated_cost_usd: number
  }
}
