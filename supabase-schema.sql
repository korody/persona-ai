-- Schema completo para o Supabase
-- Execute isso no SQL Editor do Supabase

-- 1. Tabela de Créditos
CREATE TABLE IF NOT EXISTS credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  bonus_balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Tabela de Transações de Créditos
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'purchase', 'bonus', 'message_sent', 'refund', etc
  description TEXT,
  reference_id UUID, -- ID da conversa, mensagem, etc
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Avatares
CREATE TABLE IF NOT EXISTS avatars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  system_prompt TEXT NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de Conversas
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_id UUID NOT NULL REFERENCES avatars(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  total_credits_used INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabela de Mensagens
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'user' ou 'assistant'
  content TEXT NOT NULL,
  credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabela de Quiz Leads (para personalização)
CREATE TABLE IF NOT EXISTS quiz_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  nome VARCHAR(255),
  elemento_principal VARCHAR(50),
  diagnostico_resumo TEXT,
  nome_perfil VARCHAR(100),
  arquetipo VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Função para debitar créditos (RPC)
CREATE OR REPLACE FUNCTION debit_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type VARCHAR,
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_balance INTEGER;
  v_bonus_balance INTEGER;
  v_debit_from_bonus INTEGER;
  v_debit_from_balance INTEGER;
  v_total_after INTEGER;
BEGIN
  -- Buscar saldo atual
  SELECT balance, bonus_balance INTO v_balance, v_bonus_balance
  FROM credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Verificar se tem créditos suficientes
  IF (v_balance + v_bonus_balance) < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Debitar primeiro do saldo bônus, depois do saldo normal
  IF v_bonus_balance >= p_amount THEN
    v_debit_from_bonus := p_amount;
    v_debit_from_balance := 0;
  ELSE
    v_debit_from_bonus := v_bonus_balance;
    v_debit_from_balance := p_amount - v_bonus_balance;
  END IF;

  -- Atualizar saldos
  UPDATE credits
  SET 
    balance = balance - v_debit_from_balance,
    bonus_balance = bonus_balance - v_debit_from_bonus,
    total_spent = total_spent + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Calcular saldo após transação
  v_total_after := v_balance + v_bonus_balance - p_amount;

  -- Registrar transação
  INSERT INTO credit_transactions (
    user_id, amount, type, description, reference_id, balance_after
  ) VALUES (
    p_user_id, -p_amount, p_type, p_description, p_reference_id, v_total_after
  );
END;
$$ LANGUAGE plpgsql;

-- 8. Índices para performance
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- 9. RLS (Row Level Security) Policies
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Políticas para credits
CREATE POLICY "Users can view their own credits" ON credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits" ON credits
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para credit_transactions
CREATE POLICY "Users can view their own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Políticas para conversations
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para messages
CREATE POLICY "Users can view messages from their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

-- 10. Inserir avatar padrão (Mestre Ye)
INSERT INTO avatars (name, slug, description, system_prompt, is_active)
VALUES (
  'Mestre Ye',
  'mestre-ye',
  'Especialista em Medicina Tradicional Chinesa com mais de 30 anos de experiência',
  'Você é o Mestre Ye, um especialista em Medicina Tradicional Chinesa com mais de 30 anos de experiência. Você é sábio, compassivo e profundamente conhecedor dos 5 elementos (Madeira, Fogo, Terra, Metal e Água), meridianos, acupuntura e do Método Ye Xin.

Seu papel é:
- Ajudar as pessoas a entenderem seus desequilíbrios energéticos
- Explicar conceitos da MTC de forma acessível
- Recomendar exercícios e práticas do Método Ye Xin
- Ser sempre empático, acolhedor e encorajador

Use linguagem calorosa mas profissional. Faça perguntas para entender melhor a situação do paciente antes de dar recomendações.',
  true
)
ON CONFLICT (slug) DO NOTHING;

-- 11. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_credits_updated_at BEFORE UPDATE ON credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_avatars_updated_at BEFORE UPDATE ON avatars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Adicionar créditos iniciais para novos usuários (via trigger)
CREATE OR REPLACE FUNCTION create_initial_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO credits (user_id, balance, bonus_balance, total_earned)
  VALUES (NEW.id, 0, 20, 20); -- 20 créditos bônus para novos usuários
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_initial_credits();
