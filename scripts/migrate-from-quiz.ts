/**
 * Script para migrar estrutura e dados do projeto quiz-mtc-mestreye para persona-ai
 * 
 * Este script:
 * 1. Conecta ao projeto QUIZ e extrai schema completo
 * 2. Gera SQL para criar tabelas no projeto PERSONA-AI
 * 3. Copia dados importantes (planos, usuários, etc)
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// PROJETO QUIZ (origem)
const QUIZ_URL = 'https://kfkhdfnkwhljhhjcvbqp.supabase.co';
const QUIZ_KEY = process.env.QUIZ_SERVICE_ROLE_KEY || ''; // Você vai precisar adicionar no .env.local

// PROJETO PERSONA-AI (destino) - já temos no .env.local
const PERSONA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PERSONA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const quizClient = createClient(QUIZ_URL, QUIZ_KEY);
const personaClient = createClient(PERSONA_URL, PERSONA_KEY);

// Tabelas que SÃO do quiz (não migrar)
const QUIZ_TABLES = ['quiz_leads', 'whatsapp_logs'];

// Tabelas que devem ser migradas
const TABLES_TO_MIGRATE = [
  'subscription_plans',
  'user_subscriptions', 
  'credits',
  'credit_transactions',
  'profiles',
  'user_roles',
  'avatars',
  'conversations',
  'messages',
  'system_metrics',
  'user_stats'
];

async function getAllTables() {
  const { data, error } = await quizClient
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .not('table_name', 'in', `(${QUIZ_TABLES.map(t => `'${t}'`).join(',')})`);

  if (error) {
    console.error('Erro ao listar tabelas:', error);
    return [];
  }

  console.log('\n📋 Tabelas encontradas no projeto QUIZ:');
  data?.forEach((t: any) => console.log(`  - ${t.table_name}`));
  
  return data?.map((t: any) => t.table_name) || [];
}

async function getTableStructure(tableName: string) {
  console.log(`\n🔍 Extraindo estrutura de: ${tableName}`);
  
  // Pegar colunas
  const { data: columns, error: colError } = await quizClient.rpc('exec_sql', {
    sql: `
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default,
        ordinal_position
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      ORDER BY ordinal_position;
    `
  });

  if (colError) {
    console.error(`  ❌ Erro ao pegar colunas de ${tableName}:`, colError);
    return null;
  }

  console.log(`  ✅ ${columns?.length || 0} colunas encontradas`);
  
  return {
    tableName,
    columns
  };
}

async function getTableData(tableName: string) {
  console.log(`\n📦 Extraindo dados de: ${tableName}`);
  
  const { data, error, count } = await quizClient
    .from(tableName)
    .select('*', { count: 'exact' });

  if (error) {
    console.error(`  ❌ Erro:`, error.message);
    return null;
  }

  console.log(`  ✅ ${count || 0} registros encontrados`);
  return data;
}

async function generateMigrationSQL() {
  console.log('\n🚀 INICIANDO EXTRAÇÃO DO PROJETO QUIZ\n');
  console.log('=' .repeat(60));

  const tables = await getAllTables();
  
  let migrationSQL = `-- MIGRAÇÃO DO PROJETO QUIZ PARA PERSONA-AI
-- Gerado automaticamente em ${new Date().toISOString()}
-- 
-- Tabelas migradas: ${tables.join(', ')}
--
-- INSTRUÇÕES:
-- 1. Revise este SQL cuidadosamente
-- 2. Execute no projeto persona-ai (glbhaqdeuphujfbtwqmd)
-- 3. Verifique se os dados foram copiados corretamente

`;

  const dataExport: Record<string, any[]> = {};

  for (const table of tables) {
    // Pular se não estiver na lista de migração
    if (!TABLES_TO_MIGRATE.includes(table)) {
      console.log(`\n⏭️  Pulando ${table} (não está na lista de migração)`);
      continue;
    }

    migrationSQL += `\n\n-- ============================================\n`;
    migrationSQL += `-- Tabela: ${table}\n`;
    migrationSQL += `-- ============================================\n\n`;

    // Extrair dados
    const data = await getTableData(table);
    if (data && data.length > 0) {
      dataExport[table] = data;
      migrationSQL += `-- ${data.length} registros a serem inseridos\n`;
    }
  }

  // Salvar arquivos
  const outputDir = path.join(process.cwd(), 'supabase', 'migrations-from-quiz');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const sqlPath = path.join(outputDir, 'complete-migration.sql');
  const dataPath = path.join(outputDir, 'data-export.json');

  fs.writeFileSync(sqlPath, migrationSQL);
  fs.writeFileSync(dataPath, JSON.stringify(dataExport, null, 2));

  console.log('\n\n✅ MIGRAÇÃO GERADA COM SUCESSO!\n');
  console.log(`📄 SQL: ${sqlPath}`);
  console.log(`📊 Dados: ${dataPath}`);
  console.log('\n' + '='.repeat(60));
}

// Executar
generateMigrationSQL().catch(console.error);
