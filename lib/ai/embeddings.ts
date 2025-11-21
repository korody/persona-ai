/**
 * Embeddings Generator
 * Gera embeddings usando OpenAI para busca semântica
 */

import OpenAI from 'openai'

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Gera embedding para um texto usando OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
	try {
		const response = await openai.embeddings.create({
			model: 'text-embedding-3-small',
			input: text,
		})

		return response.data[0].embedding
	} catch (error) {
		console.error('Error generating embedding:', error)
		throw error
	}
}

/**
 * Gera embedding otimizado para um exercício
 * Combina título, benefícios e indicações para melhor contexto
 */
export async function generateExerciseEmbedding(exercise: {
	title: string
	description?: string
	benefits?: string[]
	indications?: string[]
	organs?: string[]
}): Promise<number[]> {
	// Construir texto rico para embedding
	const parts: string[] = []

	// Título é o mais importante
	parts.push(exercise.title)

	// Descrição adiciona contexto
	if (exercise.description) {
		parts.push(exercise.description)
	}

	// Benefícios descrevem o que o exercício faz
	if (exercise.benefits && exercise.benefits.length > 0) {
		parts.push(`Benefícios: ${exercise.benefits.join(', ')}`)
	}

	// Indicações são os sintomas/condições que trata
	if (exercise.indications && exercise.indications.length > 0) {
		parts.push(`Indicado para: ${exercise.indications.join(', ')}`)
	}

	// Órgãos trabalhados
	if (exercise.organs && exercise.organs.length > 0) {
		parts.push(`Órgãos: ${exercise.organs.join(', ')}`)
	}

	const text = parts.join('. ')

	return generateEmbedding(text)
}

/**
 * Gera embedding para query de busca do usuário
 */
export async function generateQueryEmbedding(
	query: string
): Promise<number[]> {
	return generateEmbedding(query)
}
