# 🎯 SETUP DE PRICING E STRIPE

## ✅ IMPLEMENTADO

### 1. Schema do Banco de Dados
- ✅ `supabase/subscription-schema.sql` - Execute no Supabase SQL Editor
- ✅ Tabelas: `subscription_plans`, `user_subscriptions`, `credit_transactions`
- ✅ Seed com 4 planos (FREE, Aprendiz, Discípulo, Mestre)
- ✅ RLS Policies configuradas
- ✅ Funções auxiliares: `deduct_credits()`, `reset_monthly_credits()`

### 2. Componentes de UI
- ✅ `components/pricing/pricing-card.tsx`
- ✅ `components/pricing/pricing-comparison.tsx`
- ✅ `components/pricing/pricing-faq.tsx`

### 3. Páginas
- ✅ `app/pricing/page.tsx` - Página principal de pricing
- ✅ `app/dashboard/subscription/page.tsx` - Gerenciamento de assinatura

### 4. API Routes
- ✅ `app/api/stripe/checkout/route.ts` - Criar sessão de checkout
- ✅ `app/api/stripe/webhook/route.ts` - Receber eventos do Stripe

### 5. Helpers
- ✅ `lib/stripe/stripe-helpers.ts` - Funções utilitárias do Stripe

---

## 🔧 CONFIGURAÇÃO NECESSÁRIA

### 1. Executar Migration no Supabase

1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Cole o conteúdo de `supabase/subscription-schema.sql`
4. Execute (Run)

### 2. Configurar Stripe

#### a) Criar conta no Stripe
- Acesse: https://dashboard.stripe.com
- Crie uma conta (ou use existente)

#### b) Criar Produtos e Preços

No Stripe Dashboard > Products:

**PLANO APRENDIZ:**
- Nome: `Aprendiz`
- Descrição: `50 créditos por mês`
- Preço: `R$ 29,90`
- Tipo: Recorrente (Mensal)
- Copie o `Price ID` (começa com `price_`)

**PLANO DISCÍPULO:**
- Nome: `Discípulo`
- Descrição: `250 créditos por mês`
- Preço: `R$ 59,90`
- Tipo: Recorrente (Mensal)
- Copie o `Price ID`

**PLANO MESTRE:**
- Nome: `Mestre`
- Descrição: `600 créditos por mês`
- Preço: `R$ 129,90`
- Tipo: Recorrente (Mensal)
- Copie o `Price ID`

#### c) Atualizar Price IDs no Supabase

Execute este SQL no Supabase:

```sql
-- Substitua pelos IDs reais do Stripe
UPDATE subscription_plans SET stripe_price_id = 'price_XXXXX' WHERE slug = 'aprendiz';
UPDATE subscription_plans SET stripe_price_id = 'price_YYYYY' WHERE slug = 'discipulo';
UPDATE subscription_plans SET stripe_price_id = 'price_ZZZZZ' WHERE slug = 'mestre';
```

### 3. Configurar Variáveis de Ambiente

Adicione ao `.env.local`:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_... # Ou sk_live_ em produção
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Ou pk_live_ em produção
STRIPE_WEBHOOK_SECRET=whsec_... # Obtenha na próxima etapa

# URLs
NEXT_PUBLIC_URL=http://localhost:3000 # Ou sua URL de produção
```

### 4. Configurar Webhook do Stripe

#### Desenvolvimento Local (Stripe CLI):

1. Instale Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe # macOS
# ou baixe em: https://stripe.com/docs/stripe-cli
```

2. Login:
```bash
stripe login
```

3. Forward webhooks:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

4. Copie o `webhook signing secret` (whsec_...) e adicione ao `.env.local`

#### Produção (Vercel):

1. No Stripe Dashboard > Developers > Webhooks
2. Clique em "Add endpoint"
3. URL: `https://seu-dominio.com/api/stripe/webhook`
4. Eventos para ouvir:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copie o `Signing secret` e adicione às env vars da Vercel

### 5. Testar Checkout

1. Execute o servidor: `pnpm dev`
2. Acesse: `http://localhost:3000/pricing`
3. Clique em um plano pago
4. Use cartão de teste do Stripe:
   - Número: `4242 4242 4242 4242`
   - Data: Qualquer data futura
   - CVC: Qualquer 3 dígitos
   - CEP: Qualquer 5 dígitos

### 6. Adicionar rota ao middleware

Certifique-se de que `/dashboard/subscription` está protegida no `middleware.ts`:

```typescript
const protectedRoutes = [
  '/chat',
  '/dashboard',
  '/settings',
]
```

---

## 🎨 ESPECIFICAÇÕES DOS PLANOS

### Plano FREE
- **Preço:** R$ 0,00
- **Créditos:** 20/mês (durante 6 meses)
- **Bônus:** 50 créditos de boas-vindas
- **Histórico:** 7 dias
- **Stripe:** Não tem Price ID (grátis)

### Plano Aprendiz
- **Preço:** R$ 29,90/mês
- **Créditos:** 50/mês
- **Histórico:** 30 dias
- **Stripe:** Precisa de Price ID

### Plano Discípulo ⭐ (Mais Popular)
- **Preço:** R$ 59,90/mês
- **Créditos:** 250/mês
- **Histórico:** Ilimitado
- **Features:** Áudio TTS, Suporte prioritário
- **Stripe:** Precisa de Price ID

### Plano Mestre
- **Preço:** R$ 129,90/mês
- **Créditos:** 600/mês
- **Histórico:** Ilimitado
- **Features:** Áudio bidirecional, Upload de imagens, Suporte VIP
- **Stripe:** Precisa de Price ID

---

## 📊 FLUXO DE ASSINATURA

1. Usuário acessa `/pricing`
2. Clica em "Assinar Agora" em um plano pago
3. Sistema verifica autenticação
4. Cria/busca Stripe Customer
5. Cria Checkout Session
6. Redireciona para Stripe Checkout
7. Usuário preenche dados e paga
8. Stripe envia webhook `checkout.session.completed`
9. Sistema cria registro em `user_subscriptions`
10. Credita créditos iniciais
11. Usuário é redirecionado para `/dashboard/subscription?payment=success`

---

## 🔒 SEGURANÇA

- ✅ RLS habilitado em todas as tabelas
- ✅ Usuário só vê sua própria assinatura
- ✅ Webhook com verificação de signature
- ✅ Customer ID salvo nos metadados do usuário
- ✅ Todas as operações de crédito registradas

---

## 📈 PRÓXIMOS PASSOS

- [ ] Implementar portal de gerenciamento (Stripe Billing Portal)
- [ ] Adicionar pacotes avulsos de créditos
- [ ] Implementar notificações de créditos baixos
- [ ] Criar relatórios de uso
- [ ] Adicionar cupons de desconto
- [ ] Implementar trial period

---

## 🐛 DEBUG

### Ver logs do webhook:
```bash
stripe logs tail
```

### Testar webhook localmente:
```bash
stripe trigger checkout.session.completed
```

### Ver eventos no dashboard:
https://dashboard.stripe.com/test/events

---

## 📞 SUPORTE

- Stripe Docs: https://stripe.com/docs
- Supabase Docs: https://supabase.com/docs
- GitHub Issues: [seu-repo]/issues

---

✅ **TUDO PRONTO!** Agora configure as variáveis de ambiente e teste o checkout.
