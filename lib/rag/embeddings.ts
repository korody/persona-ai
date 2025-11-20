/**
 * Embeddings - Geração de vetores usando OpenAI
 */

export interface EmbeddingOptions {
  model?: 'text-embedding-3-small' | 'text-embedding-3-large'
  dimensions?: number // 1536 para small, 3072 para large
}

/**
 * Gera embedding de um texto usando OpenAI
 */
export async function generateEmbedding(
  text: string,
  options: EmbeddingOptions = {}
): Promise<number[]> {
  const {
    model = 'text-embedding-3-small',
    dimensions = 1536,
  } = options

  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: text,
        dimensions,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`)
    }

    const data = await response.json()
    return data.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

/**
 * Gera embeddings em lote (máximo 2048 inputs por request)
 */
export async function generateEmbeddings(
  texts: string[],
  options: EmbeddingOptions = {}
): Promise<number[][]> {
  const {
    model = 'text-embedding-3-small',
    dimensions = 1536,
  } = options

  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  // OpenAI limita a 2048 inputs por request
  if (texts.length > 2048) {
    throw new Error('Maximum 2048 texts per batch')
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: texts,
        dimensions,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`)
    }

    const data = await response.json()
    
    // Retornar embeddings na mesma ordem dos inputs
    return data.data
      .sort((a: any, b: any) => a.index - b.index)
      .map((item: any) => item.embedding)
  } catch (error) {
    console.error('Error generating embeddings:', error)
    throw error
  }
}

/**
 * Processa textos em batches para evitar rate limits
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  options: EmbeddingOptions = {},
  batchSize: number = 100
): Promise<number[][]> {
  const batches: string[][] = []
  
  for (let i = 0; i < texts.length; i += batchSize) {
    batches.push(texts.slice(i, i + batchSize))
  }

  const results: number[][] = []
  
  for (const batch of batches) {
    const embeddings = await generateEmbeddings(batch, options)
    results.push(...embeddings)
    
    // Delay entre batches para evitar rate limit
    if (batches.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  return results
}

/**
 * Estima custo de embeddings
 */
export function estimateEmbeddingCost(
  textLength: number,
  model: 'text-embedding-3-small' | 'text-embedding-3-large' = 'text-embedding-3-small'
): number {
  // Estimativa: 1 token ≈ 4 caracteres
  const estimatedTokens = Math.ceil(textLength / 4)
  
  // Preços por 1M tokens (abril 2024)
  const pricePerMillion = model === 'text-embedding-3-small' ? 0.02 : 0.13
  
  return (estimatedTokens / 1_000_000) * pricePerMillion
}
