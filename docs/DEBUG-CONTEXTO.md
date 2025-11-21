# Debug de Contexto da IA - Playground

## O que é?

O **Debug de Contexto** é uma ferramenta de transparência que mostra exatamente quais dados estão sendo enviados para a IA ao fazer recomendações de exercícios. Isso ajuda a entender como o sistema funciona e validar se as recomendações são precisas.

## Como usar

### 1. Acesse a aba Playground

No painel de administração, vá para **Treinamento de Avatares** → **Playground**

### 2. Digite uma mensagem de teste

Escreva uma mensagem como se fosse um usuário real pedindo uma recomendação:
- "Quero melhorar minha ansiedade"
- "Preciso de exercícios para dor nas costas"
- "Qual exercício para fortalecer o baço?"

### 3. Clique em "Testar Contexto"

Antes de enviar a mensagem para o chat, clique no botão **🔍 Testar Contexto** no painel de Debug.

### 4. Analise os resultados

O sistema mostrará 4 seções principais:

#### 🩺 Dados da Anamnese
- **Nome**: Nome do usuário ou paciente
- **Elemento**: Elemento predominante segundo MTC (TERRA, ÁGUA, FOGO, METAL, MADEIRA)
- **Intensidade**: Nível de desequilíbrio (0-10)
- **Data**: Quando a anamnese foi criada

#### 📚 Base de Conhecimento Encontrada
- **Total**: Quantos documentos/exercícios foram encontrados
- **Threshold**: Limiar de similaridade (70% = 0.7)
- **Máximo**: Número máximo de documentos retornados (5)

#### 🎯 Exercícios Recomendados
Para cada exercício encontrado, você vê:
- **Título** e **Curso**
- **Status**: ✅ Ativo ou 🚫 Inativo
- **Nível**: INICIANTE, INTERMEDIÁRIO ou AVANÇADO
- **Elemento**: Elemento MTC associado
- **Duração**: Tempo em minutos
- **Match %**: Grau de similaridade com a mensagem (0-100%)

#### 💬 Contexto da Conversa
- **Mensagens na conversa**: Quantas mensagens foram trocadas
- **Última mensagem do usuário**: A mensagem atual sendo testada

## O que validar

### ✅ Verifique se apenas exercícios ATIVOS aparecem
O sistema deve filtrar automaticamente exercícios desativados. Se aparecer algum exercício com badge "Inativo", há um problema na filtragem.

### ✅ Confirme a relevância dos exercícios
Os exercícios com maior % de match devem realmente fazer sentido para a mensagem do usuário.

### ✅ Valide o elemento MTC
Se a anamnese indica elemento FOGO, os exercícios recomendados devem preferencialmente ser do mesmo elemento ou de elementos complementares.

### ✅ Confira a categorização
Todos os exercícios devem ter:
- Duração preenchida (não 0 min)
- Nível definido
- Elemento MTC definido

## Casos de uso

### Teste 1: Usuário com ansiedade (Elemento FOGO)
```
Mensagem: "Estou muito ansioso e não consigo dormir"

Esperado:
- Exercícios do elemento ÁGUA (acalma o FOGO)
- Nível INICIANTE ou INTERMEDIÁRIO
- Cursos: saude-e-longevidade, dose-semanal
- Match > 75%
```

### Teste 2: Usuário com dor lombar
```
Mensagem: "Tenho dor crônica na região lombar"

Esperado:
- Curso: protocolo-lombar
- Exercícios específicos para lombar
- Match > 80%
- Todos os exercícios ATIVOS
```

### Teste 3: Iniciante sem experiência
```
Mensagem: "Nunca pratiquei Qi Gong, por onde começar?"

Esperado:
- Nível INICIANTE predominante
- Exercícios mais curtos (15-30min)
- Cursos introdutórios
- Match diversificado (50-80%)
```

## Troubleshooting

### ❌ Erro: "Failed to fetch debug data"
**Causa**: Problema na API de debug  
**Solução**: Verifique os logs do servidor e se a rota `/api/playground/debug` está acessível

### ❌ Nenhum exercício encontrado
**Causa**: 
- Mensagem muito genérica
- Threshold muito alto
- Todos os exercícios do curso estão inativos

**Solução**:
- Reformule a mensagem com mais contexto
- Verifique se há exercícios ativos no curso esperado
- Use `pnpm check-active` para validar

### ❌ Exercícios com categorização incompleta
**Causa**: Exercício não foi categorizado ou semantizado

**Solução**:
```bash
# Verificar status
pnpm check-categorization

# Auto-categorizar pendentes
pnpm auto-categorize

# Semantizar exercícios
pnpm semantize-courses <curso-slug>
```

### ❌ Match % muito baixo (< 50%)
**Causa**: 
- Exercício pouco relacionado à mensagem
- Embedding não capturou a semântica corretamente
- Falta de palavras-chave na descrição do exercício

**Solução**:
- Enriqueça os campos `benefits` e `indications` do exercício no Memberkit
- Resincronize o curso
- Reprocesse os embeddings

## Próximos passos

Após validar o debug, você pode:

1. **Enviar a mensagem real** no chat para ver a resposta completa da IA
2. **Comparar** se os exercícios recomendados batem com os do debug
3. **Ajustar** a categorização de exercícios que estão aparecendo incorretamente
4. **Desativar** exercícios que não deveriam aparecer nas recomendações

## Scripts úteis

```bash
# Verificar status de todos os cursos ativos
pnpm check-active

# Ver exercícios desativados
pnpm check-disabled

# Categorizar automaticamente
pnpm auto-categorize

# Semantizar curso específico
pnpm semantize-courses saude-e-longevidade-com-qi-gong
```

## Dados técnicos

- **Modelo de Embedding**: OpenAI text-embedding-3-small
- **Threshold padrão**: 0.7 (70% de similaridade)
- **Máximo de documentos**: 5
- **Filtro**: Apenas exercícios com `enabled=true`
- **Função RPC**: `match_exercises()`

## Referências

- Código do componente: `components/training/context-debug.tsx`
- API de debug: `app/api/playground/debug/route.ts`
- Chat playground: `components/training/playground-tab.tsx`
