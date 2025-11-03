# Como Configurar os Créditos Reais no Supabase

## Passo 1: Criar as tabelas no banco de dados

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Execute o arquivo `supabase-schema.sql` completo

Isso vai criar:
- ✅ Tabela `credits`
- ✅ Tabela `credit_transactions`
- ✅ Tabela `avatars` (com Mestre Ye)
- ✅ Tabela `conversations`
- ✅ Tabela `messages`
- ✅ Função `debit_credits()` (RPC)
- ✅ Trigger para criar créditos automáticos para novos usuários

## Passo 2: Adicionar créditos para seu usuário

### Opção A: Pegar seu user_id e adicionar créditos manualmente

```sql
-- 1. Descobrir seu user_id
SELECT id, email FROM auth.users;

-- 2. Adicionar créditos (substitua 'SEU_USER_ID')
INSERT INTO credits (user_id, balance, bonus_balance, total_earned)
VALUES (
  'seu-user-id-aqui',
  100,  -- Créditos normais
  20,   -- Créditos bônus
  120   -- Total ganho
)
ON CONFLICT (user_id) 
DO UPDATE SET
  balance = 100,
  bonus_balance = 20,
  total_earned = 120;
```

### Opção B: Adicionar para TODOS os usuários existentes

```sql
INSERT INTO credits (user_id, balance, bonus_balance, total_earned)
SELECT 
  id as user_id,
  100 as balance,
  20 as bonus_balance,
  120 as total_earned
FROM auth.users
ON CONFLICT (user_id) 
DO UPDATE SET
  balance = 100,
  bonus_balance = 20,
  total_earned = 120;
```

## Passo 3: Verificar se está funcionando

```sql
-- Ver créditos de todos os usuários
SELECT 
  u.email,
  c.balance,
  c.bonus_balance,
  (c.balance + c.bonus_balance) as total,
  c.total_earned,
  c.total_spent
FROM auth.users u
LEFT JOIN credits c ON c.user_id = u.id;
```

## Passo 4: Testar no Frontend

1. Recarregue a página do chat
2. Os créditos devem aparecer no canto superior direito
3. Envie uma mensagem (deve debitar 1 crédito)
4. Veja o saldo atualizar automaticamente

## Estrutura de Créditos

- **balance**: Créditos normais (comprados/ganhos)
- **bonus_balance**: Créditos bônus (promocionais)
- **total**: balance + bonus_balance
- **total_earned**: Total de créditos já recebidos
- **total_spent**: Total de créditos já gastos

## Sistema de Débito

Quando uma mensagem é enviada:
1. Primeiro usa créditos **bônus**
2. Depois usa créditos **normais**
3. Registra tudo em `credit_transactions`

## Troubleshooting

### Créditos não aparecem?

1. Verifique se o usuário tem créditos no banco:
```sql
SELECT * FROM credits WHERE user_id = 'seu-user-id';
```

2. Verifique os logs do navegador (F12 > Console)

3. Teste o endpoint diretamente:
```bash
# No terminal
curl http://localhost:3001/api/credits \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Créditos não atualizam após mensagem?

1. Verifique se a função `debit_credits` existe:
```sql
SELECT * FROM pg_proc WHERE proname = 'debit_credits';
```

2. Veja se há erros na API:
- Abra DevTools (F12)
- Vá em Network
- Envie uma mensagem
- Veja a resposta da chamada `/api/chat`

## Variáveis de Ambiente Necessárias

No arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
ANTHROPIC_API_KEY=sk-ant-xxx...
```

**Importante**: O `SUPABASE_SERVICE_ROLE_KEY` é necessário para as operações do backend!
