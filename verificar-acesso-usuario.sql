-- ============================================
-- VERIFICAR ACESSO DO USUÁRIO AOS PRODUTOS
-- ============================================

-- 1. Ver seu user_id
SELECT id, email, phone FROM auth.users WHERE email = 'SEU_EMAIL_AQUI';

-- 2. Ver produtos que você tem na tabela user_products
SELECT 
  up.user_id,
  up.product_id,
  up.created_at,
  -- Tentar encontrar o produto correspondente
  (SELECT product_name FROM avatar_products WHERE memberkit_product_id = up.product_id LIMIT 1) as product_name
FROM user_products up
WHERE up.user_id = 'SEU_USER_ID_AQUI';

-- 3. Ver todos os produtos do Arte da Cura
SELECT 
  id,
  product_name,
  memberkit_product_id,
  memberkit_url,
  is_available
FROM avatar_products
WHERE product_name ILIKE '%Arte da Cura%';

-- 4. INSERIR ACESSO MANUALMENTE (se não existir)
-- Substitua os valores:
-- - SEU_USER_ID: copie da query 1
-- - MEMBERKIT_PRODUCT_ID: copie da query 3 (campo memberkit_product_id do Arte da Cura)

INSERT INTO user_products (user_id, product_id, created_at)
VALUES ('SEU_USER_ID_AQUI', 'MEMBERKIT_PRODUCT_ID_AQUI', NOW())
ON CONFLICT DO NOTHING;

-- 5. VERIFICAR se funcionou
SELECT * FROM user_products WHERE product_id = 'MEMBERKIT_PRODUCT_ID_AQUI';
