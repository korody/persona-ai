// Script para verificar tabela subscription_plans

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSubscriptionPlans() {
  console.log('📋 Verificando tabela subscription_plans\n')

  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
    
    if (error) {
      console.log('❌ Erro ao acessar subscription_plans:', error.message)
      console.log('   Code:', error.code)
      console.log('\n⚠️  A tabela NÃO existe no projeto persona-ai')
    } else {
      console.log(`✅ Tabela subscription_plans existe!`)
      console.log(`   Total de planos: ${data?.length || 0}\n`)
      
      if (data && data.length > 0) {
        console.log('Planos encontrados:')
        data.forEach((plan: any) => {
          console.log(`\n- ${plan.name} (${plan.slug})`)
          console.log(`  ID: ${plan.id}`)
          console.log(`  Preço: R$ ${plan.price_brl}`)
          console.log(`  Créditos: ${plan.price_usd || 'N/A'}`)
        })
      }
    }
  } catch (e: any) {
    console.log('❌ Exceção:', e.message)
  }
  
  // Verificar também user_subscriptions
  console.log('\n📋 Verificando tabela user_subscriptions\n')
  
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .limit(5)
    
    if (error) {
      console.log('❌ Erro ao acessar user_subscriptions:', error.message)
      console.log('   Code:', error.code)
      console.log('\n⚠️  A tabela NÃO existe no projeto persona-ai')
    } else {
      console.log(`✅ Tabela user_subscriptions existe!`)
      console.log(`   Total de assinaturas: ${data?.length || 0}`)
    }
  } catch (e: any) {
    console.log('❌ Exceção:', e.message)
  }
}

checkSubscriptionPlans()
