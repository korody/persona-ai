-- ============================================
-- REMOVER CTA PADRÃO DOS DIAGNÓSTICOS
-- Remove texto da Black November e outros CTAs fixos
-- ============================================

-- Visualizar diagnósticos que contêm CTAs antigos
SELECT 
  id,
  nome,
  email,
  elemento_principal,
  LENGTH(diagnostico_completo) as tamanho_antes,
  CASE 
    WHEN diagnostico_completo LIKE '%Black November%' THEN 'Contém Black November'
    WHEN diagnostico_completo LIKE '%SEU PRÓXIMO PASSO%' THEN 'Contém CTA genérico'
    ELSE 'OK'
  END as status_cta
FROM quiz_leads
WHERE diagnostico_completo IS NOT NULL
  AND (
    diagnostico_completo LIKE '%Black November%'
    OR diagnostico_completo LIKE '%SEU PRÓXIMO PASSO%'
  )
ORDER BY created_at DESC;

-- ============================================
-- OPÇÃO 1: Remover seção específica do CTA
-- ============================================

-- Este UPDATE remove o padrão de CTA que começa com "💡 SEU PRÓXIMO PASSO ESSENCIAL:"
-- Ajuste o padrão de acordo com seu texto específico

UPDATE quiz_leads
SET diagnostico_completo = REGEXP_REPLACE(
  diagnostico_completo,
  '💡 SEU PRÓXIMO PASSO ESSENCIAL:.*$',
  '',
  'ns'  -- flags: n = newline sensitive, s = . matches newline
),
updated_at = NOW()
WHERE diagnostico_completo IS NOT NULL
  AND diagnostico_completo LIKE '%💡 SEU PRÓXIMO PASSO ESSENCIAL:%';

-- ============================================
-- OPÇÃO 2: Remover referências à Black November
-- ============================================

UPDATE quiz_leads
SET diagnostico_completo = REPLACE(
  diagnostico_completo,
  'Black November da Saúde Vitalícia',
  'nossos programas de saúde'
),
updated_at = NOW()
WHERE diagnostico_completo LIKE '%Black November%';

-- ============================================
-- VERIFICAR RESULTADO
-- ============================================

SELECT 
  id,
  nome,
  email,
  elemento_principal,
  LEFT(diagnostico_completo, 200) as preview,
  LENGTH(diagnostico_completo) as tamanho
FROM quiz_leads
WHERE diagnostico_completo IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;

-- ============================================
-- BACKUP (IMPORTANTE!)
-- ============================================

-- Antes de executar os UPDATEs acima, crie uma tabela de backup:

CREATE TABLE quiz_leads_backup_diagnosticos AS
SELECT 
  id,
  diagnostico_completo,
  created_at,
  NOW() as backup_date
FROM quiz_leads
WHERE diagnostico_completo IS NOT NULL;

-- Para restaurar um diagnóstico específico:
-- UPDATE quiz_leads 
-- SET diagnostico_completo = (
--   SELECT diagnostico_completo 
--   FROM quiz_leads_backup_diagnosticos 
--   WHERE id = 'SEU_ID_AQUI'
-- )
-- WHERE id = 'SEU_ID_AQUI';

-- ============================================
-- ✅ INSTRUÇÕES DE USO
-- ============================================

/*
1. Execute primeiro a query SELECT para ver quais registros serão afetados
2. Crie o backup executando o CREATE TABLE
3. Execute o UPDATE apropriado (Opção 1 ou 2)
4. Verifique o resultado com a última SELECT
5. Se algo der errado, restaure do backup

IMPORTANTE: Ajuste os padrões de texto de acordo com o formato 
exato do CTA que você usa nos seus diagnósticos.
*/
