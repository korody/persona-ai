/**
 * Popular subscription_plans no projeto persona-ai
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedSubscriptionPlans() {
  console.log('\n🌱 POPULANDO SUBSCRIPTION_PLANS\n');
  console.log('='.repeat(70));

  const plans = [
    {
      slug: 'aprendiz',
      name: 'Aprendiz',
      description: 'Ideal para começar sua jornada com o Mestre Ye',
      price_brl: 29.90,
      credits_monthly: 50,
      features: [
        "50 interações por mês com o Mestre Ye",
        "Chat ilimitado (1 crédito por interação)",
        "Histórico de 30 dias",
        "Suporte via email"
      ],
      sort_order: 1,
      is_active: true
    },
    {
      slug: 'discipulo',
      name: 'Discípulo',
      description: 'Para quem quer mergulhar fundo na medicina chinesa',
      price_brl: 59.90,
      credits_monthly: 250,
      features: [
        "250 interações por mês com o Mestre Ye",
        "Chat ilimitado (1 crédito por interação)",
        "Histórico completo",
        "Áudio (Text-to-Speech)",
        "Suporte prioritário",
        "Acesso antecipado a novos recursos"
      ],
      sort_order: 2,
      is_active: true
    },
    {
      slug: 'mestre',
      name: 'Mestre',
      description: 'Experiência completa e personalizada',
      price_brl: 129.90,
      credits_monthly: 600,
      features: [
        "600 interações por mês com o Mestre Ye",
        "Tudo do plano Discípulo",
        "Áudio bidirecional (falar e ouvir)",
        "Upload de imagens para análise",
        "Suporte VIP dedicado",
        "Sessões mensais em grupo (em breve)"
      ],
      sort_order: 3,
      is_active: true
    }
  ];

  for (const plan of plans) {
    console.log(`\n📦 Inserindo plano: ${plan.name}`);
    
    const { data, error } = await supabase
      .from('subscription_plans')
      .upsert(plan, {
        onConflict: 'slug',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error(`  ❌ Erro:`, error.message);
    } else {
      console.log(`  ✅ Sucesso! ID: ${data.id}`);
      console.log(`     R$ ${plan.price_brl} - ${plan.credits_monthly} créditos/mês`);
    }
  }

  // Verificar planos inseridos
  console.log('\n\n📋 PLANOS CADASTRADOS:\n');
  console.log('='.repeat(70));
  
  const { data: allPlans, error: selectError } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('sort_order');

  if (selectError) {
    console.error('❌ Erro ao listar:', selectError);
  } else {
    allPlans?.forEach(p => {
      console.log(`\n${p.name.toUpperCase()} (${p.slug})`);
      console.log(`  R$ ${p.price_brl} - ${p.credits_monthly} créditos/mês`);
      console.log(`  Features: ${p.features.length} itens`);
      console.log(`  Ativo: ${p.is_active ? '✅' : '❌'}`);
    });
  }

  console.log('\n' + '='.repeat(70));
}

seedSubscriptionPlans().catch(console.error);
