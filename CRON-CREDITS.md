# Cron de Reset Mensal de Créditos

Job que roda **todo dia 1 do mês às 09:00 UTC** e reseta o `balance` de cada usuário com assinatura ativa para o `credits_monthly` do plano dele.

## Como funciona

| Plano | Slug | Créditos resetados por mês |
|-------|------|----------------------------|
| FREE | `free` | 20 |
| Aprendiz | `aprendiz` | 50 |
| Discípulo | `discipulo` | 250 |
| Mestre | `mestre` | 600 |

- Apenas usuários com `user_subscriptions.status = 'active'` são processados.
- O `balance` é **substituído** pelo valor do plano (modelo "use ou perca").
- O `bonus_balance` (créditos de boas-vindas, promoções) **não é alterado**.
- Cada reset registra uma linha em `credit_transactions` com `type = 'monthly_reset'`.

## Arquivos envolvidos

- [vercel.json](vercel.json) — agenda do cron (`0 9 1 * *`).
- [app/api/cron/reset-credits/route.ts](app/api/cron/reset-credits/route.ts) — endpoint chamado pelo Vercel Cron.
- [supabase/migrations/reset-monthly-credits-all-plans.sql](supabase/migrations/reset-monthly-credits-all-plans.sql) — função `reset_monthly_credits_all()` no banco.

## Setup

### 1. Aplicar a migration no Supabase

No Supabase SQL Editor, execute o conteúdo de `supabase/migrations/reset-monthly-credits-all-plans.sql`. Isso vai:

- Remover a função antiga `reset_free_monthly_credits()` (que só tratava FREE e tinha limite de 6 meses).
- Criar `reset_monthly_credits_all()`.

### 2. Definir o `CRON_SECRET` na Vercel

No painel da Vercel → Settings → Environment Variables:

```
CRON_SECRET=<string aleatória longa>
```

Esse valor é enviado pelo Vercel Cron como `Authorization: Bearer <CRON_SECRET>` e validado pela rota antes de executar qualquer coisa. Sem ele, requisições não autenticadas retornam 401.

> Gerar um secret: `openssl rand -hex 32` (ou qualquer string aleatória longa).

### 3. Verificar o agendamento

`vercel.json` já contém:

```json
{
  "crons": [
    { "path": "/api/cron/reset-credits", "schedule": "0 9 1 * *" }
  ]
}
```

Após o deploy, em **Vercel → Cron Jobs**, o job aparece listado. A próxima execução acontece automaticamente no próximo dia 1.

## Testar manualmente

### Rodar agora em produção/preview

```bash
curl -X GET "https://<seu-domínio>/api/cron/reset-credits" \
  -H "Authorization: Bearer <CRON_SECRET>"
```

Resposta esperada:

```json
{
  "success": true,
  "users_reset": 42,
  "breakdown": { "free": 30, "aprendiz": 8, "discipulo": 3, "mestre": 1 },
  "users": [ /* uma linha por usuário */ ]
}
```

### Rodar direto no Supabase (sem passar pelo endpoint)

```sql
SELECT * FROM reset_monthly_credits_all();
```

### Verificar transações registradas

```sql
SELECT user_id, amount, type, description, balance_after, created_at
FROM credit_transactions
WHERE type = 'monthly_reset'
ORDER BY created_at DESC
LIMIT 20;
```

## Troubleshooting

**O cron não aparece na Vercel.**
Faça redeploy do projeto após alterar `vercel.json` — a Vercel só registra crons no momento do build.

**401 ao chamar manualmente.**
O `CRON_SECRET` no header não bate com a env var. Confira o valor na Vercel e refaça o deploy se acabou de adicioná-lo.

**`users_reset: 0`.**
Provavelmente nenhum usuário tem assinatura ativa. Verifique:

```sql
SELECT COUNT(*) FROM user_subscriptions WHERE status = 'active';
```

Se a contagem for zero, o problema está no fluxo de criação de assinatura (webhook do Stripe / signup do FREE), não no cron.

**Quero que o saldo acumule em vez de ser substituído.**
Trocar a linha `SET balance = v_user.credits_monthly` por `SET balance = balance + v_user.credits_monthly` em `reset-monthly-credits-all-plans.sql` e re-executar a migration.
