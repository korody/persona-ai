-- PARTE 0: Limpar tabelas antigas (execute PRIMEIRO se já tentou criar antes)

DROP TABLE IF EXISTS public.highlighted_conversations CASCADE;
DROP TABLE IF EXISTS public.learned_patterns CASCADE;
DROP TABLE IF EXISTS public.conversation_feedback CASCADE;
DROP TABLE IF EXISTS public.user_communication_preferences CASCADE;
DROP TABLE IF EXISTS public.user_memory CASCADE;
DROP TABLE IF EXISTS public.avatar_prompt_versions CASCADE;
DROP TABLE IF EXISTS public.avatar_conversation_examples CASCADE;
DROP TABLE IF EXISTS public.avatar_knowledge_base CASCADE;

DROP FUNCTION IF EXISTS match_knowledge CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Mensagem de sucesso
SELECT 'Tabelas antigas removidas com sucesso!' as status;
