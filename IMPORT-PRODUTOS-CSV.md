# Sistema de Importação de Produtos via CSV

## 📋 Visão Geral

Sistema que permite importar produtos em massa através de arquivos CSV, economizando tempo ao cadastrar múltiplos produtos de uma vez.

## 🎯 Funcionalidades

### 1. Importação em Massa
- Upload de arquivo CSV com todos os produtos
- Processamento automático de campos
- Validação e conversão de dados
- Inserção em lote no banco de dados

### 2. Template Pronto
- Download de template CSV com formato correto
- Exemplo de produto incluído
- Todas as colunas necessárias pré-configuradas

### 3. Mapeamento Inteligente
- Conversão automática de preços (R$ 1.997,00 → 1997.00)
- Detecção automática de elemento (Metal, Fogo, Terra, Água, Madeira)
- Mapeamento de tipos de produto
- Extração de tags da categoria

## 📊 Formato do CSV

### Colunas Obrigatórias

| Coluna | Descrição | Exemplo |
|--------|-----------|---------|
| Nome do Produto | Nome completo do produto | "Curso Completo de Qi Gong" |
| Descrição | Descrição detalhada | "Aprenda técnicas milenares..." |
| Pra que Serve | Benefícios e objetivos | "Desenvolver uma prática diária..." |
| Status | Ativo/Planejado/Descontinuado | "Ativo" |
| Tipo | Tipo de produto | "Curso Gravado" |
| Valor Praticado | Preço final | "R$997.00" |

### Colunas Opcionais

| Coluna | Descrição | Exemplo |
|--------|-----------|---------|
| Acesso | Duração do acesso | "1 Ano" |
| CAMPANHAS | Campanhas relacionadas | "QIG1, QIG2" |
| Categoria | Front End/Back End/High End | "Front End" |
| Sigla | Identificador curto | "QIG" |
| Valor Prateleira | Preço de tabela | "R$1,697.00" |

## 🔧 Como Usar

### Passo 1: Baixar Template
1. Acesse `/admin/avatars/[slug]/train` → **Marketing** → **Produtos**
2. Clique no botão **"Template"**
3. Arquivo `template-produtos.csv` será baixado

### Passo 2: Preencher Planilha
1. Abra o template no Excel, Google Sheets ou editor de texto
2. Preencha cada linha com um produto
3. Mantenha a primeira linha (cabeçalho) intacta
4. Certifique-se de que:
   - Status está como "Ativo" ou "Planejado"
   - Preços estão no formato correto
   - Descrições não contêm quebras de linha

### Passo 3: Salvar como CSV
- **Excel**: Arquivo → Salvar Como → CSV UTF-8
- **Google Sheets**: Arquivo → Download → CSV

### Passo 4: Importar
1. Clique no botão **"Importar CSV"**
2. Selecione seu arquivo
3. Aguarde o processamento
4. Confirme a mensagem de sucesso

## 🗂 Mapeamento de Tipos

O sistema converte automaticamente os tipos do CSV para o formato do banco:

| Tipo no CSV | Tipo no Banco |
|-------------|---------------|
| Curso Gravado | curso |
| Workshop | workshop |
| Lives | live |
| E-book | ebook |
| Livro | livro |
| Produto Físico | produto-fisico |
| Evento Presencial | evento-presencial |
| Evento Online | evento-online |
| Mentoria | mentoria |
| Sessão Individual | sessao-individual |
| Comunidade | comunidade |
| Clube | clube |
| Desafio | desafio |
| AI as a Service | ai-service |

## 🎨 Detecção Automática de Elementos

O sistema analisa Nome + Descrição e detecta automaticamente:

| Elemento | Keywords |
|----------|----------|
| METAL | metal, pulmão, respiração |
| FOGO | fogo, coração |
| TERRA | terra, baço, digestão |
| ÁGUA | água, rim, longevidade |
| MADEIRA | madeira, fígado, movimento |

## 💰 Conversão de Preços

O sistema aceita vários formatos:

✅ Formatos Aceitos:
- `R$997.00`
- `R$1.997,00`
- `R$ 997`
- `997.00`
- `997`

❌ Não use:
- Textos ("Consultar", "Gratuito")
- Símbolos extras ("US$", "€")

Para produtos gratuitos, deixe o campo vazio ou use `R$0.00`

## 🏷️ Sistema de Tags

Tags são geradas automaticamente a partir de:
1. **Categoria** (se informada)
2. **Tipo** de produto

Exemplo:
- Categoria: "Front End"
- Tipo: "Curso Gravado"
- Tags geradas: `["front end", "curso gravado"]`

## 🎯 Produtos em Destaque (Featured)

Produtos são marcados como "featured" automaticamente se:
- Categoria = "Front End" OU
- Categoria = "High End"

Isso faz com que apareçam primeiro nas recomendações da IA.

## ⚙️ Regras de Importação

### ✅ Produtos Importados
- Status: "Ativo" ou "Planejado"
- Nome do Produto preenchido

### ❌ Produtos Ignorados
- Status: "Descontinuado"
- Nome do Produto vazio
- Linhas vazias

## 📝 Exemplo de CSV

```csv
Nome do Produto,Acesso,CAMPANHAS,Categoria,Descrição,Pra que Serve,Sigla,Status,Tipo,Valor Prateleira,Valor Praticado
Saúde & Longevidade Qi Gong,1 Ano,,Back End,"Curso completo de Qi Gong com exercícios diários","Desenvolver uma prática diária que aumenta sua vitalidade",QIG,Ativo,Curso Gravado,"R$1,697.00","R$1,197.00"
Método Ye Xin para Aliviar Dores na Lombar,Vitalício,,Front End,Programa prático de Qi Gong,Eliminar dores lombares crônicas,EDL,Ativo,E-book,,R$29.00
Profissionalizante: Arte da Cura,1 Ano,,High End,Formação avançada para terapeutas,Capacitar-se profissionalmente,ADC,Ativo,Mentoria,,"R$12,000.00"
```

## 🔌 API Endpoint

### POST `/api/import-products`

**Request:**
```
Content-Type: multipart/form-data

file: [CSV file]
avatarSlug: "mestre-ye"
```

**Response (Success):**
```json
{
  "success": true,
  "imported": 25,
  "products": [...]
}
```

**Response (Error):**
```json
{
  "error": "Erro ao processar CSV",
  "details": "..."
}
```

## 🛠 Implementação Técnica

### Dependências
```bash
pnpm add papaparse
pnpm add -D @types/papaparse
```

### Arquivos Envolvidos

1. **`app/api/import-products/route.ts`**
   - Processa upload de CSV
   - Parse com PapaParse
   - Converte e valida dados
   - Insere em lote no Supabase

2. **`components/admin/product-manager.tsx`**
   - Botão de importação
   - Input file oculto
   - Função `handleImportCSV()`
   - Download de template

## ⚠️ Limitações e Considerações

### Limitações Técnicas
- Tamanho máximo do arquivo: ~10MB
- Máximo ~1000 produtos por importação
- Encoding: UTF-8 obrigatório

### Boas Práticas
✅ **Faça:**
- Teste com poucos produtos primeiro
- Verifique o template antes de importar
- Mantenha backup do CSV original
- Revise produtos após importação

❌ **Não Faça:**
- Importar produtos duplicados
- Usar Excel com fórmulas
- Incluir caracteres especiais excessivos
- Importar sem validar dados

## 🔒 Segurança

- Validação de tipo de arquivo (apenas .csv)
- Sanitização de dados
- Verificação de avatar_slug
- Proteção contra SQL injection (Supabase)
- Rate limiting no endpoint

## 📊 Campos Processados

| Campo CSV | Campo Banco | Processamento |
|-----------|-------------|---------------|
| Nome do Produto | product_name | Trim |
| Descrição | product_description | Trim |
| Pra que Serve | recommended_for + benefits | Trim |
| Valor Praticado | product_price_brl | Parse número |
| Tipo | product_type | Mapeamento |
| Status | is_available | Ativo/Planejado = true |
| Categoria | tags + is_featured | Array + boolean |
| - | element | Auto-detectado |
| - | product_url | Vazio (preencher depois) |

## 🚀 Fluxo de Importação

```
1. Usuário clica "Importar CSV"
2. Seleciona arquivo .csv
3. Frontend envia FormData para /api/import-products
4. Backend lê arquivo com PapaParse
5. Para cada linha válida:
   - Converte preço
   - Mapeia tipo
   - Detecta elemento
   - Gera tags
   - Define featured
6. Insere todos os produtos em lote
7. Retorna quantidade importada
8. Frontend atualiza lista de produtos
```

## 💡 Dicas de Uso

### Para Importações Grandes
1. Divida em arquivos menores (200-300 produtos cada)
2. Importe em lotes
3. Verifique cada lote antes de prosseguir

### Para Atualizar Produtos
- **NÃO use importação** para atualizar
- Importação sempre **cria novos** produtos
- Para atualizar, edite manualmente ou use script SQL

### Para Produtos com URLs
1. Importe primeiro sem URLs
2. Use scraping automático para URLs conhecidas
3. Preencha URLs manualmente para produtos internos

## 🐛 Troubleshooting

### "Erro ao processar CSV"
- Verifique encoding (deve ser UTF-8)
- Confirme que cabeçalhos estão corretos
- Remova linhas completamente vazias

### "Nenhum produto importado"
- Verifique se Status está "Ativo" ou "Planejado"
- Confirme que "Nome do Produto" está preenchido
- Veja se há produtos duplicados já cadastrados

### "Preços não convertidos"
- Use formato R$XXX.XX ou R$X.XXX,XX
- Remova espaços extras
- Não use texto no campo de preço

---

**Desenvolvido para Persona AI - Sistema de Marketing Inteligente**
