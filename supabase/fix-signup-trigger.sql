-- ============================================
-- FIX: Corrigir trigger de vinculação de quiz
-- Problema: NEW.phone não existe em auth.users
-- Solução: Usar raw_user_meta_data->>'phone'
-- ============================================

CREATE OR REPLACE FUNCTION link_quiz_to_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_quiz_id UUID;
  v_matched_by TEXT;
  v_user_phone TEXT;
BEGIN
  -- Extrair telefone do metadata do usuário
  v_user_phone := NEW.raw_user_meta_data->>'phone';
  
  -- Buscar quiz leads não vinculados para este usuário
  -- Prioridade 1: Telefone (mais único e confiável)
  IF v_user_phone IS NOT NULL AND v_user_phone != '' THEN
    SELECT id INTO v_quiz_id
    FROM quiz_leads
    WHERE telefone = v_user_phone
      AND user_id IS NULL
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_quiz_id IS NOT NULL THEN
      v_matched_by := 'telefone';
    END IF;
  END IF;
  
  -- Prioridade 2: Email (se não encontrou por telefone)
  IF v_quiz_id IS NULL THEN
    SELECT id INTO v_quiz_id
    FROM quiz_leads
    WHERE email = NEW.email
      AND user_id IS NULL
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_quiz_id IS NOT NULL THEN
      v_matched_by := 'email';
    END IF;
  END IF;
  
  -- Se encontrou algum quiz, vincular ao usuário
  IF v_quiz_id IS NOT NULL THEN
    UPDATE quiz_leads
    SET user_id = NEW.id,
        updated_at = NOW()
    WHERE id = v_quiz_id;
    
    -- Log para debug
    RAISE NOTICE 'Quiz % vinculado ao usuário % via %', v_quiz_id, NEW.id, v_matched_by;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, não falhar o signup, apenas logar
    RAISE WARNING 'Erro ao vincular quiz ao usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ✅ Execute este SQL no Supabase SQL Editor
-- ============================================
