-- PASSO 1: Atualizar um produto para ter memberkit_product_id (TESTE)
UPDATE avatar_products 
SET memberkit_product_id = '185202'  -- ID fictício para teste
WHERE product_name = 'Bastão da Longevidade';

-- PASSO 2: Adicionar esse produto para o usuário marko@persona.cx
INSERT INTO user_products (user_id, product_id)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'marko@persona.cx' LIMIT 1) as user_id,
  '185202' as product_id
WHERE NOT EXISTS (
  SELECT 1 FROM user_products 
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'marko@persona.cx' LIMIT 1)
  AND product_id = '185202'
);

-- PASSO 3: Verificar se funcionou
SELECT 
  up.user_id,
  up.product_id,
  ap.product_name,
  ap.memberkit_product_id,
  ap.memberkit_url,
  ap.product_url
FROM user_products up
LEFT JOIN avatar_products ap ON ap.memberkit_product_id = up.product_id
WHERE up.user_id = (SELECT id FROM auth.users WHERE email = 'marko@persona.cx' LIMIT 1);
