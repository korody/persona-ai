# Página de Pricing - Persona AI

## 📋 Visão Geral

Página moderna e profissional de pricing que exibe 3 planos de assinatura do Persona AI, buscando dados dinamicamente do Supabase.

## 🎯 Funcionalidades Implementadas

### ✅ Core Features
- [x] Busca dinâmica de planos do Supabase
- [x] 3 cards de pricing responsivos
- [x] Badge "MAIS POPULAR" no plano Discípulo
- [x] Loading state com skeleton
- [x] Error state com mensagem amigável
- [x] Hover effects e animações suaves
- [x] Redirecionamento para login se não autenticado
- [x] FAQ com accordion interativo

### 🎨 Design Highlights
- Gradient background (gray-50 to white)
- Cards com shadow-lg e hover:shadow-xl
- Plano Discípulo com borda azul destacada (border-2 border-blue-500)
- Escala 105% no hover (scale-105)
- Checkmarks verdes nas features
- Preço em destaque (text-5xl font-bold)
- Botão "Começar Agora" com loading spinner

### 📱 Responsividade
- Mobile: cards empilham verticalmente
- Tablet: 2 colunas
- Desktop: 3 colunas (grid md:grid-cols-3)
- Max-width: 7xl (1280px)

## 🗄️ Estrutura do Banco

### Tabela: `subscription_plans`

```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY,
  slug VARCHAR(50) UNIQUE,           -- 'aprendiz', 'discipulo', 'mestre'
  name VARCHAR(100),                  -- 'Aprendiz', 'Discípulo', 'Mestre'
  description TEXT,                   -- Descrição curta do plano
  price_brl DECIMAL(10,2),           -- 29.90, 59.90, 129.90
  credits_monthly INTEGER,            -- 50, 250, 600
  features JSONB,                     -- Array de strings com features
  is_active BOOLEAN DEFAULT true,     -- Controle de visibilidade
  sort_order INTEGER,                 -- Ordem de exibição (1, 2, 3)
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Seeds dos Planos

Execute o arquivo `subscription-plans-seed.sql` no Supabase SQL Editor para popular os dados.

## 📦 Planos Disponíveis

### 1. Aprendiz - R$ 29,90/mês
- 50 créditos/mês (~10-12 conversas)
- Chat com Mestre Ye
- Histórico 30 dias
- Suporte email

### 2. Discípulo - R$ 59,90/mês ⭐ MAIS POPULAR
- 250 créditos/mês (~50 conversas)
- Chat ilimitado
- Histórico completo
- Áudio TTS
- Suporte prioritário
- Early access

### 3. Mestre - R$ 129,90/mês
- 600 créditos/mês (~120 conversas)
- Tudo do Discípulo
- Áudio bidirecional
- Upload de imagens
- Suporte VIP
- Sessões em grupo (futuro)

## 🔧 Tecnologias Utilizadas

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Shadcn/ui** (Card, Button, Badge)
- **Supabase** (Database + Auth)
- **Lucide Icons** (Check, Loader2)

## 🚀 Como Usar

### 1. Executar SQL Seeds
```bash
# No Supabase SQL Editor, execute:
psql -f subscription-plans-seed.sql
```

### 2. Acessar a Página
```
http://localhost:3000/pricing
```

### 3. Fluxo do Usuário

**Não autenticado:**
1. Usuário clica em "Começar Agora"
2. Redirecionado para `/login?redirect=/pricing&plan=discipulo`
3. Após login, volta para pricing

**Autenticado:**
1. Usuário clica em "Começar Agora"
2. (Futuro) Redireciona para checkout Stripe
3. Após pagamento, ativa assinatura

## 🔮 Próximos Passos (TODO)

### Integração Stripe
```typescript
// app/api/checkout/route.ts
export async function POST(req: Request) {
  const { planSlug } = await req.json()
  
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{
      price: STRIPE_PRICE_IDS[planSlug],
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
  })
  
  return Response.json({ url: session.url })
}
```

### Toggle Anual/Mensal
```tsx
const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')

// Calcular desconto anual (10% off)
const annualDiscount = 0.10
const displayPrice = billingPeriod === 'annual' 
  ? plan.price_brl * 12 * (1 - annualDiscount) 
  : plan.price_brl
```

### Comparação de Planos
Tabela side-by-side comparando todas as features dos 3 planos.

## 📊 Métricas Importantes

- **Conversão**: Quantos usuários clicam em "Começar Agora"
- **Plano Popular**: Qual plano tem mais cliques (provavelmente Discípulo)
- **Drop-off**: Usuários que chegam ao pricing mas não convertem

## 🐛 Troubleshooting

### Planos não aparecem
```bash
# Verificar se tabela existe
SELECT * FROM subscription_plans;

# Verificar se há planos ativos
SELECT * FROM subscription_plans WHERE is_active = true;
```

### Erro de CORS
Verifique configurações do Supabase:
- API URL está correta no .env.local
- Anon key está configurada
- RLS policies permitem SELECT público

## 📝 Notas Importantes

1. **SEO**: Adicionar metadata futuramente
2. **Analytics**: Integrar Google Analytics para tracking
3. **A/B Testing**: Testar diferentes preços e copy
4. **Social Proof**: Adicionar depoimentos de usuários
5. **Garantia**: Considerar "7 dias de garantia ou dinheiro de volta"

## 🎓 Referências

- [Stripe Pricing Tables](https://stripe.com/docs/payments/checkout/pricing-table)
- [SaaS Pricing Best Practices](https://www.priceintelligently.com/)
- [Shadcn/ui Cards](https://ui.shadcn.com/docs/components/card)
