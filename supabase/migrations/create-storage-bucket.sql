/**
 * Criar bucket 'knowledge-base' no Supabase Storage
 * Execute este SQL no Supabase SQL Editor
 */

-- 1. Criar bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-base', 'knowledge-base', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Política para permitir uploads (service role apenas)
CREATE POLICY "Service role can upload knowledge files"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'knowledge-base');

-- 3. Política para leitura pública
CREATE POLICY "Public can read knowledge files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'knowledge-base');

-- 4. Política para deletar (service role apenas)
CREATE POLICY "Service role can delete knowledge files"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'knowledge-base');

-- 5. Verificar
SELECT * FROM storage.buckets WHERE id = 'knowledge-base';
