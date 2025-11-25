# 📢 Sistema de Marketing Dinâmico

Sistema completo para gerenciar campanhas e produtos que a IA pode recomendar durante as conversas.

## 🎯 Visão Geral

O sistema permite:
- **Campanhas Ativas**: Configure eventos, promoções e oportunidades temporárias
- **Catálogo de Produtos**: Gerencie todos os seus produtos e serviços
- **Recomendações Inteligentes**: IA menciona produtos/campanhas de forma natural e contextual
- **Personalização por Elemento**: Produtos podem ser associados a elementos específicos

## 📊 Estrutura do Banco de Dados

### Tabela: `avatar_campaigns`
Armazena campanhas de marketing ativas.

**Campos principais:**
- `campaign_name`: Nome da campanha
- `campaign_description`: Descrição detalhada
- `campaign_cta`: Call to action
- `campaign_url`: Link de destino
- `start_date` / `end_date`: Período de vigência
- `priority`: Prioridade (maior = mais importante)
- `target_audience`: Público-alvo
- `suggested_moments`: Quando a IA deve mencionar

### Tabela: `avatar_products`
Catálogo de produtos e serviços.

**Campos principais:**
- `product_name`: Nome do produto
- `product_type`: Tipo (curso, mentoria, ebook, evento)
- `product_description`: Descrição
- `product_price_brl`: Preço em reais
- `product_url`: Link do produto
- `tags`: Tags para busca
- `element`: Elemento associado (MADEIRA, FOGO, TERRA, METAL, ÁGUA)
- `is_featured`: Produto em destaque
- `recommended_for`: Para quem é recomendado
- `benefits`: Principais benefícios

## 🚀 Como Usar

### 1. Acessar a Interface de Administração

Navegue para: `/admin/avatars/mestre-ye/marketing`

### 2. Configurar uma Campanha

**Exemplo: Evento Presencial**
```
Nome: Imersão de Qi Gong - Janeiro 2026
Descrição: Retiro de 3 dias focado em práticas respiratórias avançadas
CTA: Garanta sua vaga agora!
URL: https://qigongbrasil.com/imersao-janeiro
Início: 2026-01-01
Término: 2026-01-15
Prioridade: 10 (alta)
Público-alvo: Praticantes intermediários e avançados
Quando mencionar: Quando usuário perguntar sobre eventos presenciais, retiros ou práticas avançadas
```

### 3. Cadastrar Produtos

**Exemplo: Curso Online**
```
Nome: Curso Completo de Qi Gong Respiratório
Tipo: curso
Descrição: 12 semanas de treinamento guiado
Preço: R$ 497,00
URL: https://qigongbrasil.com/curso-completo
Tags: respiração, iniciante, online
Elemento: METAL (opcional - se for específico para Metal)
Recomendado para: Pessoas com ansiedade, estresse e problemas respiratórios
Benefícios: Reduz ansiedade, melhora capacidade pulmonar, equilibra emoções
Produto em destaque: ✅ (se quiser priorizar)
```

### 4. Como a IA Usa as Informações

A IA recebe automaticamente:
1. **Campanha ativa** (maior prioridade, dentro do período)
2. **Top 3 produtos** relevantes (priorizando por elemento do usuário e featured)

**Exemplo de contexto que a IA recebe:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📢 CONTEXTO DE MARKETING E PRODUTOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 CAMPANHA ATIVA: Imersão de Qi Gong - Janeiro 2026

Retiro de 3 dias focado em práticas respiratórias avançadas

CTA: Garanta sua vaga agora!
LINK: https://qigongbrasil.com/imersao-janeiro

Público-alvo: Praticantes intermediários e avançados
Quando mencionar: Quando usuário perguntar sobre eventos presenciais

🛒 PRODUTOS E SERVIÇOS DISPONÍVEIS:

1. Curso Completo de Qi Gong Respiratório (curso)
   12 semanas de treinamento guiado
   Benefícios: Reduz ansiedade, melhora capacidade pulmonar
   Valor: R$ 497,00
   Link: https://qigongbrasil.com/curso-completo

INSTRUÇÕES: Mencione de forma natural quando o contexto for apropriado.
```

## 🔄 Fluxo de Trabalho Recomendado

### Antes de Cada Campanha
1. Acesse `/admin/avatars/mestre-ye/marketing`
2. Crie nova campanha com todos os detalhes
3. Defina prioridade alta (10+)
4. Configure período de vigência
5. Desative campanhas antigas

### Gerenciamento de Produtos
1. Mantenha catálogo atualizado
2. Marque produtos em destaque
3. Use tags para facilitar recomendações
4. Associe produtos a elementos quando pertinente
5. Atualize benefícios baseado em feedback

### Monitoramento
- Verifique logs do chat para ver quando IA menciona produtos
- Ajuste `suggested_moments` baseado em performance
- Atualize `target_audience` conforme necessário

## 🎨 Boas Práticas

### Para Campanhas
✅ **Faça:**
- Seja específico no "quando mencionar"
- Use prioridades para campanhas mais importantes
- Configure datas de início e término
- Mantenha apenas 1-2 campanhas ativas por vez

❌ **Evite:**
- CTAs genéricos ou vagos
- Múltiplas campanhas com mesma prioridade
- Descrições muito longas (IA tem limite de contexto)

### Para Produtos
✅ **Faça:**
- Liste benefícios claros e objetivos
- Use tags relevantes aos problemas dos usuários
- Mantenha preços atualizados
- Use "em destaque" estrategicamente

❌ **Evite:**
- Cadastrar produtos indisponíveis
- Descrições vagas ou genéricas
- Falta de URL (usuário não consegue comprar)

## 🔧 Manutenção

### Limpeza de Diagnósticos Antigos
Se você tinha CTAs fixos nos diagnósticos, execute:
```sql
-- Ver arquivo: supabase/migrations/remove-cta-from-diagnostics.sql
```

### Backup Regular
```sql
-- Backup de campanhas
CREATE TABLE avatar_campaigns_backup AS 
SELECT * FROM avatar_campaigns WHERE is_active = true;

-- Backup de produtos
CREATE TABLE avatar_products_backup AS 
SELECT * FROM avatar_products WHERE is_available = true;
```

## 📈 Métricas e Análises

### Queries Úteis

**Campanhas mais mencionadas:**
```sql
-- Requer logging adicional (feature futura)
```

**Produtos por elemento:**
```sql
SELECT element, COUNT(*) as total, 
       SUM(CASE WHEN is_available THEN 1 ELSE 0 END) as disponiveis
FROM avatar_products
WHERE avatar_slug = 'mestre-ye'
GROUP BY element;
```

## 🚨 Troubleshooting

**Campanha não aparece nas conversas:**
- Verifique se está ativa (`is_active = true`)
- Confirme se está dentro do período (`start_date` e `end_date`)
- Veja se tem prioridade configurada

**Produtos não são recomendados:**
- Confirme `is_available = true`
- Verifique se elemento está correto (ou NULL para todos)
- Revise `recommended_for` para match com casos de uso

## 🔮 Roadmap Futuro

- [ ] Analytics de menções de campanhas
- [ ] A/B testing de CTAs
- [ ] Upload de catálogo via CSV
- [ ] Integração com sistema de afiliados
- [ ] Recomendações baseadas em ML

---

**Criado em:** Novembro 2025  
**Versão:** 1.0  
**Autor:** Equipe Persona AI
