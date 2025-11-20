/**
 * Verificar TODAS as tabelas no projeto persona-ai atual
 * e comparar com o que está documentado no supabase-schema.sql
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllTables() {
  console.log('\n🔍 VERIFICANDO TODAS AS TABELAS NO PERSONA-AI\n');
  console.log('='.repeat(70));
  console.log(`\nProjeto: ${supabaseUrl}`);
  console.log('='.repeat(70));

  // Lista de tabelas esperadas baseado no schema
  const expectedTables = [
    // Auth/Users
    'profiles',
    'user_roles',
    
    // Credits/Billing
    'credits',
    'credit_transactions',
    'subscription_plans',
    'user_subscriptions',
    
    // Core
    'avatars',
    'conversations',
    'messages',
    
    // Learning System (já criadas)
    'avatar_knowledge_base',
    'avatar_conversation_examples',
    'avatar_prompt_versions',
    'user_memory',
    'user_communication_preferences',
    'conversation_feedback',
    'learned_patterns',
    'highlighted_conversations'
  ];

  console.log('\n📋 Tabelas esperadas:', expectedTables.length);
  
  for (const table of expectedTables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.code === 'PGRST204' || error.message.includes('not found')) {
          console.log(`❌ ${table.padEnd(35)} - NÃO EXISTE`);
        } else {
          console.log(`⚠️  ${table.padEnd(35)} - ERRO: ${error.message}`);
        }
      } else {
        console.log(`✅ ${table.padEnd(35)} - ${count || 0} registros`);
      }
    } catch (err: any) {
      console.log(`⚠️  ${table.padEnd(35)} - EXCEÇÃO: ${err.message}`);
    }
  }

  // Verificar quais colunas existem na tabela credits
  console.log('\n\n🔍 ESTRUTURA DA TABELA CREDITS:\n');
  console.log('='.repeat(70));
  
  try {
    const { data: credits } = await supabase
      .from('credits')
      .select('*')
      .limit(1);
    
    if (credits && credits[0]) {
      console.log('\n📊 Colunas encontradas:');
      Object.keys(credits[0]).forEach(col => {
        console.log(`  - ${col}: ${typeof credits[0][col]}`);
      });
    }
  } catch (err: any) {
    console.log('❌ Erro ao verificar credits:', err.message);
  }

  console.log('\n' + '='.repeat(70));
}

checkAllTables().catch(console.error);
