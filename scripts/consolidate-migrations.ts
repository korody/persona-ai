/**
 * Consolida todas as migrations em um único arquivo SQL
 * para executar manualmente no Supabase SQL Editor
 */

import fs from 'fs'
import path from 'path'

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
const outputFile = path.join(process.cwd(), 'supabase', 'EXECUTE-THIS.sql')

const migrations = [
  'add-training-tables-quiz.sql',
  'create-storage-bucket.sql',
]

console.log('\n📦 CONSOLIDANDO MIGRATIONS\n')
console.log('='.repeat(70))

let consolidatedSQL = `-- ============================================
-- MIGRATIONS CONSOLIDADAS PARA SUPABASE
-- Projeto: quiz-mtc-mestreye (kfkhdfnkwhljhhjcvbqp)
-- Gerado em: ${new Date().toISOString()}
-- ============================================
-- 
-- INSTRUÇÕES:
-- 1. Acesse: https://supabase.com/dashboard/project/kfkhdfnkwhljhhjcvbqp/sql
-- 2. Copie TODO este arquivo
-- 3. Cole no SQL Editor
-- 4. Clique em RUN
-- 5. Aguarde a execução completa
--
-- ============================================

`

for (const migration of migrations) {
  const filePath = path.join(migrationsDir, migration)
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Pulando: ${migration} (não encontrado)`)
    continue
  }

  console.log(`✅ Adicionando: ${migration}`)
  
  const sql = fs.readFileSync(filePath, 'utf-8')
  
  consolidatedSQL += `
-- ============================================
-- Migration: ${migration}
-- ============================================

${sql}

`
}

// Adicionar verificação final
consolidatedSQL += `
-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Listar todas as tabelas criadas
SELECT 
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE columns.table_schema = 'public' 
     AND columns.table_name = tables.table_name) as column_count
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%avatar%'
    OR table_name LIKE '%knowledge%'
    OR table_name LIKE '%user_%'
    OR table_name LIKE '%conversation%'
    OR table_name LIKE '%feedback%'
    OR table_name LIKE '%pattern%'
  )
ORDER BY table_name;

-- Listar funções criadas
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%knowledge%'
ORDER BY routine_name;

-- Listar buckets de storage
SELECT * FROM storage.buckets WHERE id = 'knowledge-base';
`

// Salvar arquivo
fs.writeFileSync(outputFile, consolidatedSQL, 'utf-8')

console.log('\n' + '='.repeat(70))
console.log(`\n✅ Arquivo criado: ${outputFile}`)
console.log(`📝 Tamanho: ${(consolidatedSQL.length / 1024).toFixed(2)} KB`)
console.log('\n📋 PRÓXIMOS PASSOS:\n')
console.log('1. Abra o arquivo: supabase/EXECUTE-THIS.sql')
console.log('2. Copie TODO o conteúdo')
console.log('3. Acesse: https://supabase.com/dashboard/project/kfkhdfnkwhljhhjcvbqp/sql')
console.log('4. Cole no SQL Editor')
console.log('5. Clique em RUN ▶️')
console.log('\n' + '='.repeat(70) + '\n')
