# Sistema de URLs Inteligente - Memberkit + Vendas

## 📋 Visão Geral

Sistema que diferencia automaticamente entre URL de acesso ao conteúdo (Memberkit) e URL de vendas, garantindo que:
- Usuários **com acesso** recebam link direto para o conteúdo
- Usuários **sem acesso** recebam link da página de vendas

## 🎯 Problema Resolvido

### Antes (Hard-coded)
- IA sempre enviava apenas um tipo de link
- Usuários com acesso eram direcionados para página de vendas
- Usuários sem acesso recebiam links quebrados do Memberkit

### Depois (Inteligente)
- IA verifica se usuário possui o produto
- **TEM ACESSO** → Link direto do Memberkit (acessar curso)
- **NÃO TEM ACESSO** → Link da página de vendas (conhecer/comprar)

## 🗂 Estrutura de Dados

### Tabela `avatar_products`

```sql
CREATE TABLE avatar_products (
  -- ... outros campos
  
  -- URLs diferenciadas
  product_url TEXT,              -- Página de vendas (landing page)
  memberkit_url TEXT,            -- Acesso direto ao curso/conteúdo
  memberkit_product_id VARCHAR,  -- ID do produto (QIG, ADC, MAR...)
)
```

### Campos Explicados

| Campo | Descrição | Exemplo | Quando Usar |
|-------|-----------|---------|-------------|
| `product_url` | URL da página de vendas | `https://qigongbrasil.com/curso-qigong` | Quando usuário NÃO tem acesso |
| `memberkit_url` | URL do Memberkit | `https://memberkit.com/curso-qigong` | Quando usuário JÁ tem acesso |
| `memberkit_product_id` | ID do produto no Memberkit | `QIG`, `ADC`, `MAR` | Para verificar acesso do usuário |

## 🔄 Fluxo de Funcionamento

```
1. Usuário inicia conversa
   ↓
2. Sistema busca produtos recomendados
   ↓
3. Para cada produto:
   a) Verifica se tem memberkit_product_id
   b) Busca em user_products se usuário possui esse ID
   c) Define hasAccess = true/false
   ↓
4. Escolhe URL correta:
   - hasAccess=true  → usa memberkit_url
   - hasAccess=false → usa product_url
   ↓
5. IA recebe contexto com:
   - ✅ Link correto para o usuário
   - ✅ Indicador de acesso
   - ✅ Ambas URLs (sales + memberkit)
```

## 📝 Exemplos Práticos

### Exemplo 1: Usuário SEM Acesso

**Usuário:** "Como posso aprender Qi Gong?"

**Sistema verifica:**
- `memberkit_product_id: "QIG"`
- Busca em `user_products` → NÃO encontrado
- `hasAccess: false`

**IA recebe:**
```
Produto: Saúde & Longevidade Qi Gong
Status: 🔒 USUÁRIO NÃO TEM ACESSO - Use link da página de vendas
Link: https://qigongbrasil.com/curso-qigong
```

**IA responde:**
> "Para aprender Qi Gong de forma estruturada, recomendo nosso curso completo: **Saúde & Longevidade Qi Gong**. 
> 
> Você pode conhecer todos os detalhes aqui: https://qigongbrasil.com/curso-qigong"

---

### Exemplo 2: Usuário COM Acesso

**Usuário:** "Quais exercícios fazer para dor lombar?"

**Sistema verifica:**
- `memberkit_product_id: "QIG"`
- Busca em `user_products` → ENCONTRADO
- `hasAccess: true`

**IA recebe:**
```
Produto: Saúde & Longevidade Qi Gong
Status: ✅ USUÁRIO JÁ TEM ACESSO - Use link direto do Memberkit
Link: https://memberkit.com/curso-qigong/modulo-lombar
```

**IA responde:**
> "Você já tem acesso ao curso Saúde & Longevidade! Para dor lombar, recomendo o **Módulo 3: Fortalecimento da Região Lombar**.
> 
> Acesse aqui: https://memberkit.com/curso-qigong/modulo-lombar"

---

### Exemplo 3: Produto Sem Memberkit

**Produto físico ou serviço sem área de membros**

**Campos:**
- `product_url: "https://loja.com/camiseta"`
- `memberkit_url: NULL`
- `memberkit_product_id: NULL`

**Resultado:**
- Sempre usa `product_url`
- Não verifica acesso (não aplicável)

## 🛠 Implementação Técnica

### 1. Migration SQL (`add-marketing-config.sql`)

```sql
-- Adiciona campos de diferenciação de URLs
ALTER TABLE avatar_products 
  ADD COLUMN memberkit_url TEXT,
  ADD COLUMN memberkit_product_id VARCHAR(255);

COMMENT ON COLUMN avatar_products.product_url IS 
  'URL da página de vendas - usada quando usuário NÃO tem acesso';
  
COMMENT ON COLUMN avatar_products.memberkit_url IS 
  'URL do produto na plataforma Memberkit - usada quando usuário JÁ tem acesso';
  
COMMENT ON COLUMN avatar_products.memberkit_product_id IS 
  'ID do produto no Memberkit para verificar se usuário tem acesso';
```

### 2. Helper de Marketing (`lib/helpers/marketing-helpers.ts`)

```typescript
export async function getMarketingContext(
  supabase: SupabaseClient,
  avatarSlug: string,
  userId?: string,  // ← Novo parâmetro
  userElement?: string | null
): Promise<MarketingContext> {
  
  // 1. Buscar produtos do usuário
  let userProducts: Set<string> = new Set()
  if (userId) {
    const { data } = await supabase
      .from('user_products')
      .select('product_id')
      .eq('user_id', userId)
    
    if (data) {
      userProducts = new Set(data.map(p => p.product_id))
    }
  }
  
  // 2. Para cada produto recomendado
  productsData.map(p => {
    const hasAccess = p.memberkit_product_id && 
                     userProducts.has(p.memberkit_product_id)
    
    // Escolher URL correta
    const url = hasAccess && p.memberkit_url 
      ? p.memberkit_url  // ✅ Tem acesso → Memberkit
      : p.product_url    // 🔒 Não tem → Vendas
    
    return {
      url,
      hasAccess,
      salesPageUrl: p.product_url,
      memberkitUrl: p.memberkit_url
    }
  })
}
```

### 3. Contexto para IA (formatado)

```
🛒 PRODUTOS E SERVIÇOS DISPONÍVEIS:

1. Saúde & Longevidade Qi Gong (curso)
   Curso completo de Qi Gong com exercícios diários
   Benefícios: Desenvolver uma prática diária que aumenta sua vitalidade
   Valor: R$ 1.197,00
   ✅ USUÁRIO JÁ TEM ACESSO - Use link direto do Memberkit
   Link: https://memberkit.com/curso-qigong

2. Método Ye Xin para Aliviar Dores na Lombar (ebook)
   Programa prático de Qi Gong para lombar
   Benefícios: Eliminar dores lombares crônicas
   Valor: R$ 29,00
   🔒 USUÁRIO NÃO TEM ACESSO - Use link da página de vendas
   Link: https://qigongbrasil.com/ebook-lombar

INSTRUÇÕES IMPORTANTES SOBRE LINKS:
- Se o usuário JÁ TEM ACESSO (✅): use o link do Memberkit para ele acessar o conteúdo diretamente
- Se o usuário NÃO TEM ACESSO (🔒): use o link da página de vendas para ele conhecer/comprar
- Ao sugerir exercícios ou cursos que o usuário possui, sempre forneça o link direto
- Seja sempre ético - só recomende produtos que agreguem valor real ao usuário
```

## 📋 Interface de Cadastro

### ProductManager - Novos Campos

```tsx
{/* URLs Diferenciadas */}
<div className="grid gap-4 md:grid-cols-2">
  <div>
    <Label>URL da Página de Vendas</Label>
    <Input 
      value={formData.product_url}
      placeholder="https://exemplo.com/produto"
    />
    <p className="text-xs text-muted-foreground">
      Para usuários que NÃO possuem acesso
    </p>
  </div>
</div>

<div className="grid gap-4 md:grid-cols-2">
  <div>
    <Label>URL do Memberkit (Acesso ao Curso)</Label>
    <Input 
      value={formData.memberkit_url}
      placeholder="https://memberkit.com/curso"
    />
    <p className="text-xs text-muted-foreground">
      Para usuários que JÁ possuem acesso
    </p>
  </div>
  
  <div>
    <Label>ID do Produto no Memberkit</Label>
    <Input 
      value={formData.memberkit_product_id}
      placeholder="QIG, ADC, MAR..."
    />
    <p className="text-xs text-muted-foreground">
      Usado para verificar se usuário tem acesso
    </p>
  </div>
</div>
```

## 🔍 Verificação de Acesso

### Tabela `user_products` (Memberkit)

```sql
SELECT * FROM user_products 
WHERE user_id = '123' 
  AND product_id = 'QIG';
```

**Resultado:**
- **Encontrado** → Usuário TEM acesso ao produto QIG
- **Vazio** → Usuário NÃO TEM acesso

## 📊 Casos de Uso

### ✅ Produtos com Área de Membros

| Tipo | Exemplo | product_url | memberkit_url | memberkit_product_id |
|------|---------|-------------|---------------|---------------------|
| Curso | Qi Gong | Landing page | Área do aluno | QIG |
| Mentoria | Arte da Cura | Página de vendas | Portal do aluno | ADC |
| Workshop | 5 Elementos | Inscrição | Sala virtual | EMT |

### ❌ Produtos sem Área de Membros

| Tipo | Exemplo | product_url | memberkit_url | memberkit_product_id |
|------|---------|-------------|---------------|---------------------|
| E-book | Dores Lombar | Download/compra | NULL | NULL |
| Produto Físico | Camiseta | Loja online | NULL | NULL |
| Evento Único | Imersão | Inscrição | NULL | NULL |

## 💡 Boas Práticas

### ✅ Faça

1. **Sempre preencha** `product_url` (obrigatório)
2. **Preencha `memberkit_url`** apenas se houver área de membros
3. **Use IDs consistentes** (QIG, ADC, MAR) entre Memberkit e sistema
4. **Teste ambos os links** antes de salvar
5. **Mantenha URLs atualizadas** quando mudar plataforma

### ❌ Não Faça

1. Não inverta as URLs (vendas ↔ memberkit)
2. Não use IDs diferentes no Memberkit e no sistema
3. Não coloque link do Memberkit em `product_url`
4. Não deixe `memberkit_product_id` vazio se há área de membros
5. Não use caracteres especiais em IDs (apenas letras/números)

## 🐛 Troubleshooting

### Problema: Usuário com acesso recebe link de vendas

**Causas possíveis:**
- `memberkit_product_id` não preenchido
- ID não bate com tabela `user_products`
- `memberkit_url` vazio

**Solução:**
1. Verifique o ID do produto no Memberkit
2. Confirme que `user_products` tem o produto vinculado
3. Preencha `memberkit_url` corretamente

---

### Problema: Usuário sem acesso recebe link do Memberkit

**Causas possíveis:**
- Lógica invertida no código
- Cache desatualizado

**Solução:**
1. Verifique função `getMarketingContext`
2. Limpe cache do navegador
3. Re-execute migration SQL

---

### Problema: IDs não batem

**Exemplo:**
- Sistema: `memberkit_product_id: "QIG"`
- Memberkit: `product_id: "qi-gong"`

**Solução:**
Padronize os IDs. Use o mesmo formato em ambos os sistemas.

## 🚀 Melhorias Futuras

- [ ] Sincronização automática Memberkit ↔ Sistema
- [ ] Cache de verificações de acesso
- [ ] Analytics de conversão (vendas vs memberkit)
- [ ] Deep linking para módulos específicos
- [ ] Expiração de acesso (assinaturas)

---

**Desenvolvido para Persona AI - Sistema de Marketing Inteligente**
