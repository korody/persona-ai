// types/marketing.ts

export interface AvatarCampaign {
  id: string
  avatar_slug: string
  campaign_name: string
  campaign_description: string | null
  campaign_cta: string | null
  campaign_url: string | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  priority: number
  target_audience: string | null
  suggested_moments: string | null
  created_at: string
  updated_at: string
}

export interface AvatarProduct {
  id: string
  avatar_slug: string
  product_name: string
  product_type: string | null
  product_description: string | null
  product_price_brl: number | null
  product_url: string | null // URL da página de vendas
  memberkit_url: string | null // URL do produto no Memberkit
  memberkit_course_id: number | null // ID do curso no Memberkit (link com hub_courses)
  tags: string[] | null
  element: string | null
  is_available: boolean
  is_featured: boolean
  recommended_for: string | null
  benefits: string | null
  created_at: string
  updated_at: string
}

export interface MarketingContext {
  activeCampaign: {
    name: string
    description: string
    cta: string
    url: string
    targetAudience: string
    suggestedMoments: string
  } | null
  recommendedProducts: {
    name: string
    type: string
    description: string
    price: number | null
    url: string // URL correta baseada no acesso do usuário
    salesPageUrl: string // URL da página de vendas (sempre disponível)
    memberkitUrl: string | null // URL do Memberkit (se disponível)
    hasAccess: boolean // Se o usuário já tem acesso
    benefits: string
  }[]
}
