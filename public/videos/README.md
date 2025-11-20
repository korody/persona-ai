# Vídeos do Persona AI

## 📹 Vídeo de Saudação do Mestre Ye

### Localização
`/public/videos/mestre-ye-welcome.mp4`

### Especificações Recomendadas

**Formato:**
- Codec: H.264
- Container: MP4
- Resolução: 1920x1080 (Full HD) ou 1280x720 (HD)
- Aspect Ratio: 16:9 ou 1:1 (quadrado)
- Frame Rate: 30fps ou 60fps

**Tamanho:**
- Máximo: 10MB (para carregamento rápido)
- Recomendado: 3-5MB

**Duração:**
- Recomendado: 5-10 segundos
- Máximo: 15 segundos

**Áudio:**
- Opcional (vídeo atual está com `muted`)
- Se adicionar áudio, considere remover `muted` do componente

### Como Adicionar o Vídeo

1. **Coloque o arquivo de vídeo aqui:**
   ```
   public/videos/mestre-ye-welcome.mp4
   ```

2. **O vídeo será exibido automaticamente quando:**
   - Usuário abre o chat pela primeira vez
   - Não há mensagens na conversa
   - Loop infinito (autoplay + loop)

### Futuras Implementações

#### Vídeo Personalizado com Nome do Usuário

```typescript
// Exemplo de implementação futura
const [user, setUser] = useState<any>(null)

useEffect(() => {
  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }
  loadUser()
}, [])

// No componente de vídeo:
<video src={`/videos/welcome-${user?.id}.mp4`} />
```

#### Geração Dinâmica via API
- Usar serviços como D-ID, Synthesia ou HeyGen
- Gerar vídeo com nome do usuário
- Cache no Supabase Storage
- Fallback para vídeo padrão se não existir

### Otimizações

**Compressão:**
```bash
# Usando FFmpeg para otimizar
ffmpeg -i input.mp4 \
  -c:v libx264 \
  -crf 28 \
  -preset slow \
  -c:a aac \
  -b:a 128k \
  output.mp4
```

**Lazy Loading:**
```typescript
// Carregar vídeo apenas quando necessário
<video loading="lazy" preload="auto">
```

**WebM como alternativa:**
```html
<video>
  <source src="/videos/mestre-ye-welcome.webm" type="video/webm">
  <source src="/videos/mestre-ye-welcome.mp4" type="video/mp4">
</video>
```

### Placeholder Atual

Enquanto o vídeo não for adicionado, o sistema exibe:
- Fallback: ícone verde do Mestre Ye (MessageSquare)
- Sem erro 404 no console
- UX não é quebrada

### Checklist para Adicionar Vídeo

- [ ] Criar vídeo de saudação (5-10s)
- [ ] Otimizar para web (< 5MB)
- [ ] Salvar como `mestre-ye-welcome.mp4`
- [ ] Colocar em `public/videos/`
- [ ] Testar no navegador
- [ ] (Opcional) Adicionar versão WebM
- [ ] (Futuro) Implementar personalização com nome

## 🎬 Exemplos de Conteúdo do Vídeo

**Opção 1 - Curta (5s):**
```
[Mestre Ye acena com a mão]
"Olá! Sou o Mestre Ye. Como posso ajudá-lo hoje?"
```

**Opção 2 - Média (8s):**
```
[Mestre Ye em posição serena]
"Bem-vindo! Sou o Mestre Ye, especialista em Medicina 
Tradicional Chinesa. Estou aqui para guiá-lo no caminho 
do equilíbrio e bem-estar."
```

**Opção 3 - Com Nome (10s - futuro):**
```
[Mestre Ye sorri]
"Olá, [NOME]! É um prazer recebê-lo novamente. 
Como você está se sentindo hoje?"
```

## 📊 Métricas

Quando implementado, considere trackear:
- Taxa de visualização do vídeo
- Tempo médio assistido
- Impacto na conversão (primeira mensagem)
- Feedback dos usuários
