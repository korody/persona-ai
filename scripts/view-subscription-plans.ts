/**
 * Verificar planos de assinatura cadastrados
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function viewPlans() {
  console.log('\n💎 PLANOS DE ASSINATURA CADASTRADOS\n');
  console.log('='.repeat(70));

  const { data: plans, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('sort_order');

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  plans?.forEach((plan, index) => {
    const isPremium = plan.slug === 'discipulo';
    console.log(`\n${index + 1}. ${plan.name.toUpperCase()} ${isPremium ? '⭐ MAIS POPULAR' : ''}`);
    console.log('   ' + '-'.repeat(66));
    console.log(`   📌 Slug: ${plan.slug}`);
    console.log(`   💰 Preço: R$ ${plan.price_brl}/mês`);
    console.log(`   🪙 Créditos: ${plan.credits_monthly} créditos/mês`);
    console.log(`   📝 Descrição: ${plan.description}`);
    console.log(`   ✨ Features (${plan.features.length}):`);
    plan.features.forEach((f: string) => {
      console.log(`      • ${f}`);
    });
    console.log(`   🟢 Ativo: ${plan.is_active ? 'Sim' : 'Não'}`);
    console.log(`   🆔 ID: ${plan.id}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log(`\n✅ Total: ${plans?.length || 0} planos cadastrados`);
  console.log('\n📊 Resumo:');
  console.log('   • Aprendiz: R$ 29,90 → 50 créditos');
  console.log('   • Discípulo: R$ 59,90 → 250 créditos ⭐');
  console.log('   • Mestre: R$ 129,90 → 600 créditos');
  console.log('\n');
}

viewPlans().catch(console.error);
