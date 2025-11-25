# Sistema de Auto-Preenchimento via Scraping

## 📋 Visão Geral

Sistema que permite extrair automaticamente informações de páginas web para preencher formulários de produtos e campanhas de marketing.

## 🎯 Funcionalidades

### 1. Auto-preenchimento de Produtos
- Cole URL de página de produto/curso
- Sistema extrai automaticamente:
  - **Nome do produto** (meta tags og:title, h1, title)
  - **Descrição** (meta description, og:description)
  - **Preço** (detecta vários formatos: R$ 997, R$ 1.997,00, etc)
  - **Tipo** (curso, evento, ebook, mentoria - via keywords)
  - **URL** (preserva o link original)

### 2. Auto-preenchimento de Campanhas
- Cole URL de página de evento/promoção
- Sistema extrai:
  - **Nome da campanha**
  - **Descrição**
  - **URL da campanha**
  - CTA padrão: "Saiba mais"

## 🔧 Como Usar

### No Painel de Produtos

1. Acesse `/admin/avatars/[slug]/train`
2. Clique na aba **📢 Marketing** → **Produtos**
3. Clique em **Novo Produto**
4. No campo **"Auto-preencher com dados de URL"**:
   - Cole o link da página do produto
   - Pressione Enter OU clique no botão de upload
5. Os campos serão preenchidos automaticamente
6. Revise e ajuste conforme necessário
7. Salve o produto

### No Painel de Campanhas

1. Acesse `/admin/avatars/[slug]/train`
2. Clique na aba **📢 Marketing** → **Campanhas**
3. Clique em **Nova Campanha**
4. No campo **"Auto-preencher com dados de URL"**:
   - Cole o link da página da campanha/evento
   - Pressione Enter OU clique no botão de upload
5. Os campos serão preenchidos automaticamente
6. Complete informações adicionais (público-alvo, quando mencionar)
7. Salve a campanha

## 📊 O Que é Extraído

### Ordem de Prioridade para Extração

#### Título
1. `<meta property="og:title">`
2. `<meta name="twitter:title">`
3. `<h1>` (primeiro encontrado)
4. `<title>` (tag do documento)

#### Descrição
1. `<meta property="og:description">`
2. `<meta name="description">`
3. `<meta name="twitter:description">`
4. `<p>` (primeiro parágrafo)

#### Preço
- Busca em elementos com:
  - `[itemprop="price"]`
  - `.price` ou `[class*="price"]`
  - `[class*="valor"]`
  - `<meta property="product:price:amount">`
- Formatos suportados:
  - `R$ 997`
  - `R$ 1.997,00`
  - `997.00`
  - `1997`

#### Tipo de Produto (auto-detectado via keywords)
- **curso**: curso, course, aula, treinamento
- **evento**: evento, event, workshop, imersão, retiro
- **ebook**: ebook, e-book, livro, book
- **mentoria**: mentoria, coaching, consultoria

## 🔌 API Endpoint

### POST `/api/scrape-product`

**Request:**
```json
{
  "url": "https://exemplo.com/produto"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "product_name": "Curso Completo de Qi Gong",
    "product_description": "Aprenda as técnicas milenares...",
    "product_price_brl": 997.00,
    "product_type": "curso",
    "product_url": "https://exemplo.com/produto",
    "image_url": "https://exemplo.com/imagem.jpg"
  }
}
```

**Response (Error):**
```json
{
  "error": "Não foi possível acessar a URL"
}
```

## 🛠 Implementação Técnica

### Dependências
```bash
pnpm add jsdom
pnpm add -D @types/jsdom
```

### Arquivos Envolvidos

1. **`app/api/scrape-product/route.ts`**
   - API route que faz o scraping
   - Usa JSDOM para parsing HTML
   - Extrai dados via meta tags e seletores CSS

2. **`components/admin/product-manager.tsx`**
   - Campo de URL com botão de auto-preenchimento
   - Função `handleScrapeUrl()` para produtos

3. **`components/admin/campaign-manager.tsx`**
   - Campo de URL com botão de auto-preenchimento
   - Função `handleScrapeUrl()` para campanhas

## 💡 Boas Práticas

### ✅ Faça
- Cole URLs de páginas bem estruturadas com meta tags
- Revise sempre os dados extraídos antes de salvar
- Ajuste manualmente campos específicos (público-alvo, quando mencionar)
- Use em páginas com Open Graph tags (Facebook/LinkedIn share)

### ❌ Não Faça
- Confiar 100% nos dados extraídos sem revisar
- Usar em páginas sem estrutura HTML adequada
- Esperar extração perfeita de sites complexos/SPA
- Usar em páginas que exigem autenticação

## 🎯 Casos de Uso Ideais

### Funciona Bem Com:
- ✅ Páginas de vendas (Hotmart, Eduzz, Kiwify)
- ✅ Landing pages de eventos
- ✅ Páginas de cursos online
- ✅ Sites com meta tags Open Graph
- ✅ Páginas estáticas bem estruturadas

### Limitações:
- ❌ SPAs (React/Vue) com conteúdo dinâmico via JS
- ❌ Páginas que exigem login
- ❌ Sites com anti-scraping (Cloudflare, etc)
- ❌ Conteúdo carregado via AJAX após load

## 🔒 Segurança

- API valida presença de URL
- Timeout de requisição HTTP
- Sanitização de dados extraídos
- Descrições limitadas a 500 caracteres
- User-Agent configurado para evitar bloqueios

## 📝 Exemplo de Fluxo

```
1. Usuário cola URL: https://hotmart.com/curso-qigong
2. Sistema faz request para /api/scrape-product
3. API busca a página com fetch()
4. JSDOM parseia o HTML
5. Sistema extrai:
   - Título: "Curso Completo de Qi Gong"
   - Descrição: "Aprenda técnicas milenares..."
   - Preço: R$ 997,00
   - Tipo: "curso"
6. Retorna JSON com dados
7. Frontend preenche formulário automaticamente
8. Usuário revisa e salva
```

## 🚀 Melhorias Futuras

- [ ] Suporte a páginas JavaScript-rendered (Puppeteer)
- [ ] Cache de URLs já scrapeadas
- [ ] Extração de imagens otimizada
- [ ] Suporte a mais formatos de preço
- [ ] Detecção de datas de eventos
- [ ] Extração de bullets/benefícios
- [ ] Suporte multilíngue

## 📞 Troubleshooting

### "Não foi possível acessar a URL"
- Verifique se a URL está acessível
- Alguns sites bloqueiam scraping
- Tente copiar manualmente os dados

### "Campos não preenchidos corretamente"
- Site pode não ter meta tags
- Estrutura HTML diferente do esperado
- Ajuste manualmente os campos

### "Preço não detectado"
- Formato de preço não suportado
- Digite manualmente o valor
- Reporte o formato para melhorias

---

**Desenvolvido para Persona AI - Sistema de Marketing Inteligente**
