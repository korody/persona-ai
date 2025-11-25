-- Script para mapear produtos (avatar_products) com cursos do Memberkit (exercises)
-- Execute este script para ver quais produtos você pode vincular

-- 1. Ver todos os cursos únicos do Memberkit (da tabela exercises)
SELECT DISTINCT
  memberkit_course_id,
  memberkit_course_slug,
  COUNT(DISTINCT memberkit_lesson_id) as total_exercicios,
  MIN(title) as exemplo_exercicio
FROM exercises
WHERE memberkit_course_id IS NOT NULL
GROUP BY memberkit_course_id, memberkit_course_slug
ORDER BY total_exercicios DESC;

-- 2. Ver produtos que ainda NÃO têm memberkit_product_id
SELECT 
  id,
  product_name,
  product_type,
  memberkit_product_id,
  memberkit_url,
  product_url
FROM avatar_products
WHERE avatar_slug = 'mestre-ye'
  AND memberkit_product_id IS NULL
ORDER BY product_name;

-- 3. EXEMPLO de como vincular manualmente:
-- Substitua os valores conforme necessário

/*
-- Exemplo 1: Vincular "Saúde & Longevidade Qi Gong" ao curso do Memberkit
UPDATE avatar_products 
SET 
  memberkit_product_id = '185202',  -- ID do curso no Memberkit
  memberkit_url = 'https://mestre-ye.memberkit.com.br/185202-saude-e-longevidade-com-qi-gong'
WHERE product_name = 'Saúde & Longevidade Qi Gong';

-- Exemplo 2: Vincular "Profissionalizante: Arte da Cura"
UPDATE avatar_products 
SET 
  memberkit_product_id = '123456',  -- ID do curso no Memberkit
  memberkit_url = 'https://mestre-ye.memberkit.com.br/123456-arte-da-cura'
WHERE product_name = 'Profissionalizante: Arte da Cura';
*/

-- 4. Verificar produtos vinculados
SELECT 
  product_name,
  product_type,
  memberkit_product_id,
  memberkit_url,
  (SELECT COUNT(*) FROM exercises WHERE memberkit_course_id::text = memberkit_product_id) as total_exercicios
FROM avatar_products
WHERE avatar_slug = 'mestre-ye'
  AND memberkit_product_id IS NOT NULL
ORDER BY product_name;
