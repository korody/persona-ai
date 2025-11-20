-- Adicionar políticas para service_role poder inserir/atualizar conhecimento

-- Permitir service_role fazer tudo
CREATE POLICY "Service role can manage knowledge"
  ON avatar_knowledge_base
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage examples"
  ON avatar_conversation_examples
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage prompts"
  ON avatar_prompt_versions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
