-- ============================================
-- DELETAR USUÁRIO E DADOS RELACIONADOS
-- ============================================

-- ATENÇÃO: Este script deleta PERMANENTEMENTE seus dados
-- Execute apenas se tiver certeza!

-- 1. Verificar o usuário primeiro
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'marko@persona.cx';

-- 2. Deletar primeiro os logs do WhatsApp (devido à foreign key)
DELETE FROM whatsapp_logs
WHERE lead_id IN (
  SELECT id FROM quiz_leads WHERE email = 'marko@persona.cx'
);

-- 3. Deletar da tabela quiz_leads (dados da anamnese)
DELETE FROM quiz_leads
WHERE email = 'marko@persona.cx';

-- 4. Deletar da tabela auth.users
-- CUIDADO: Isso deleta o usuário permanentemente
DELETE FROM auth.users
WHERE email = 'marko@persona.cx';

-- 4. Verificar se foi deletado
SELECT COUNT(*) as total_usuarios 
FROM auth.users 
WHERE email = 'marko@persona.cx';
-- Deve retornar 0

SELECT COUNT(*) as total_quiz_leads 
FROM quiz_leads 
WHERE email = 'marko@persona.cx';
-- Deve retornar 0
