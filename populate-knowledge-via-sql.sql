-- Popular Knowledge Base diretamente via SQL
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Buscar ID do avatar Mestre Ye
SELECT id, name, slug FROM avatars WHERE slug = 'mestre-ye';
-- Copie o ID retornado e substitua 'SEU_AVATAR_ID' abaixo

-- 2. Inserir conhecimento sobre Dor nas Costas
INSERT INTO avatar_knowledge_base (
  avatar_id,
  title,
  content,
  content_type,
  tags,
  embedding,
  is_active,
  created_by
) VALUES (
  '92a09b63-b866-45d4-8453-1528388cd562', -- Mestre Ye ID
  'Dor nas Costas - Elemento Água',
  'Na Medicina Tradicional Chinesa, dores nas costas, especialmente na região lombar, estão frequentemente relacionadas ao Elemento Água e aos Rins. Os Rins governam os ossos, a medula e a região lombar. Quando há deficiência de Qi ou Yang dos Rins, pode manifestar-se como dor lombar crônica, sensação de frio nas costas, fraqueza nas pernas e cansaço. O tratamento envolve: tonificação dos Rins através de exercícios como Qigong, alimentação adequada (alimentos pretos como feijão preto, gergelim preto), acupuntura nos pontos B23 (Shenshu), B52 (Zhishi) e VB30 (Huantiao), e práticas que aquecem o Yang como moxa.',
  'article',
  ARRAY['dor-costas', 'elemento-agua', 'rins', 'lombar'],
  NULL, -- Embedding será gerado depois via API
  true,
  '92a09b63-b866-45d4-8453-1528388cd562' -- Mesmo ID do avatar como created_by temporário
);

-- 3. Inserir conhecimento sobre Ansiedade
INSERT INTO avatar_knowledge_base (
  avatar_id,
  title,
  content,
  content_type,
  tags,
  embedding,
  is_active,
  created_by
) VALUES (
  '92a09b63-b866-45d4-8453-1528388cd562',
  'Ansiedade e Elemento Madeira',
  'A ansiedade na MTC está relacionada principalmente ao Elemento Madeira e ao Fígado. O Fígado governa o livre fluxo do Qi e quando este fluxo está bloqueado, surge a estagnação que manifesta como ansiedade, irritabilidade, tensão muscular (especialmente ombros e pescoço), dificuldade de concentração e alterações de humor. Sintomas associados incluem suspiros frequentes, sensação de nó na garganta, distensão abdominal e tensão pré-menstrual. Tratamento: regularizar o Fígado através de exercícios de respiração, caminhadas na natureza, acupuntura nos pontos F3 (Taichong), VB34 (Yanglingquan), PC6 (Neiguan), e chás calmantes como camomila e melissa. Evitar alimentos picantes e álcool que sobrecarregam o Fígado.',
  'article',
  ARRAY['ansiedade', 'elemento-madeira', 'figado', 'estresse'],
  NULL,
  true,
  '92a09b63-b866-45d4-8453-1528388cd562'
);

-- 4. Inserir conhecimento sobre Insônia
INSERT INTO avatar_knowledge_base (
  avatar_id,
  title,
  content,
  content_type,
  tags,
  embedding,
  is_active,
  created_by
) VALUES (
  '92a09b63-b866-45d4-8453-1528388cd562',
  'Insônia e Palpitações - Elemento Fogo',
  'Insônia e palpitações na MTC estão relacionadas ao Elemento Fogo, especificamente ao Coração. O Coração abriga o Shen (espírito/mente) e quando há deficiência de Sangue do Coração ou desarmonia entre Coração e Rins, surgem sintomas como dificuldade para dormir, sono agitado, palpitações, ansiedade noturna, sonhos perturbadores e despertar frequente. Causas incluem excesso de preocupação, trabalho mental excessivo, estresse emocional prolongado. Tratamento envolve: acupuntura nos pontos C7 (Shenmen), PC6 (Neiguan), B15 (Xinshu), alimentação que nutre o Sangue (beterraba, espinafre, goji berry), práticas meditativas antes de dormir, evitar estimulantes após 16h, e exercícios suaves como Tai Chi. Massagem no ponto Yintang (entre as sobrancelhas) ajuda a acalmar a mente.',
  'article',
  ARRAY['insonia', 'palpitacoes', 'elemento-fogo', 'coracao', 'sono'],
  NULL,
  true,
  '92a09b63-b866-45d4-8453-1528388cd562'
);

-- 5. Verificar inserções
SELECT id, title, content_type, tags, created_at 
FROM avatar_knowledge_base 
WHERE avatar_id = '92a09b63-b866-45d4-8453-1528388cd562'
ORDER BY created_at DESC;
