// lib/helpers/marketing-helpers.ts

import type { SupabaseClient } from '@supabase/supabase-js'
import type { MarketingContext } from '@/types/marketing'

export async function getMarketingContext(
  supabase: SupabaseClient,
  avatarSlug: string,
  userId?: string,
  userElement?: string | null
): Promise<MarketingContext> {
  const context: MarketingContext = {
    activeCampaign: null,
    recommendedProducts: []
  }

  try {
    // 1. Buscar campanha ativa
    const { data: campaignData } = await supabase
      .rpc('get_active_campaign', { p_avatar_slug: avatarSlug })
      .single()

    if (campaignData) {
      context.activeCampaign = {
        name: (campaignData as any).campaign_name,
        description: (campaignData as any).campaign_description || '',
        cta: (campaignData as any).campaign_cta || '',
        url: (campaignData as any).campaign_url || '',
        targetAudience: (campaignData as any).target_audience || '',
        suggestedMoments: (campaignData as any).suggested_moments || ''
      }
    }

    // 2. Buscar produtos recomendados
    const { data: productsData } = await supabase
      .rpc('get_recommended_products', {
        p_avatar_slug: avatarSlug,
        p_element: userElement,
        p_limit: 3
      })

    if (productsData && productsData.length > 0) {
      context.recommendedProducts = productsData.map((p: any) => {
        // Preferir memberkit_url, sen�o usar product_url
        const url = p.memberkit_url || p.product_url || ''

        console.log(`?? Product: ${p.product_name} | URL: ${url}`)

        return {
          name: p.product_name,
          type: p.product_type || '',
          description: p.product_description || '',
          price: p.product_price_brl,
          url: url,
          salesPageUrl: p.product_url || '',
          memberkitUrl: p.memberkit_url || null,
          memberkitCourseId: p.memberkit_course_id || null,
          benefits: p.benefits || ''
        }
      })
    }
  } catch (error) {
    console.error('Error fetching marketing context:', error)
  }

  return context
}

export function formatMarketingContext(context: MarketingContext): string {
  if (!context.activeCampaign && context.recommendedProducts.length === 0) {
    return ''
  }

  let marketingSection = `

??????????????????????????????????????????????????
?? CONTEXTO DE MARKETING E PRODUTOS
??????????????????????????????????????????????????
`

  // Campanha ativa
  if (context.activeCampaign) {
    marketingSection += `
?? CAMPANHA ATIVA: ${context.activeCampaign.name}

${context.activeCampaign.description}

CTA: ${context.activeCampaign.cta}
LINK: ${context.activeCampaign.url}

P�blico-alvo: ${context.activeCampaign.targetAudience}
Quando mencionar: ${context.activeCampaign.suggestedMoments}

INSTRU��ES: Mencione esta campanha de forma natural quando o contexto for apropriado. 
N�o force a men��o, mas aproveite momentos relevantes para apresent�-la como uma oportunidade 
valiosa para o usu�rio.
`
  }

  // Produtos dispon�veis
  if (context.recommendedProducts.length > 0) {
    marketingSection += `

?? PRODUTOS E SERVI�OS DISPON�VEIS:
`
    context.recommendedProducts.forEach((product, index) => {
      const priceInfo = product.price 
        ? `R$ ${product.price.toFixed(2).replace('.', ',')}` 
        : 'Consultar'
      
      marketingSection += `
${index + 1}. ${product.name} (${product.type})
   ${product.description}
   Benef�cios: ${product.benefits}
   Valor: ${priceInfo}
   Link: ${product.url}
`
    })

    marketingSection += `
??????????????????????????????????????????????????
`
  }

  marketingSection += `
??????????????????????????????????????????????????
`

  console.log('\n?? MARKETING SECTION BEING SENT TO AI:\n', marketingSection)

  return marketingSection
}
