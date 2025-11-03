// types/database.ts

export type SubscriptionTier = 'free' | 'discipulo' | 'mestre';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';
export type MessageRole = 'user' | 'assistant' | 'system';
export type ConversationStatus = 'active' | 'archived';

export type CreditTransactionType =
  | 'signup_bonus'
  | 'monthly_reset'
  | 'purchase'
  | 'message_sent'
  | 'audio_generated'
  | 'quiz_bonus'
  | 'referral_bonus'
  | 'admin_grant'
  | 'subscription_activated';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  free_credits_months_remaining: number;
}

export interface Credits {
  id: string;
  user_id: string;
  balance: number;
  bonus_balance: number;
  total_earned: number;
  total_spent: number;
  last_reset_at: string;
  updated_at: string;
}

export interface Avatar {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_image_url: string | null;
  voice_id: string | null;
  system_prompt: string;
  is_active: boolean;
  is_admin_only: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  avatar_id: string;
  title: string;
  started_at: string;
  last_message_at: string;
  total_credits_used: number;
  status: ConversationStatus;
  metadata: Record<string, any>;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  audio_url: string | null;
  credits_used: number;
  created_at: string;
  metadata: Record<string, any>;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: CreditTransactionType;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface CreditsResponse {
  balance: number;
  bonus_balance: number;
  total: number;
  total_earned: number;
  total_spent: number;
}

export interface QuizData {
  elemento_principal: string;
  diagnostico_resumo: string;
  nome_perfil: string;
  arquetipo: string;
}