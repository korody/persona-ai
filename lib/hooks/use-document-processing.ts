/**
 * Hook para processar documentos automaticamente após upload
 */

export async function processDocumentAfterUpload(documentId: string) {
  try {
    console.log(`🔄 Iniciando processamento automático do documento ${documentId}`)

    const response = await fetch('/api/knowledge/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ documentId }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao processar documento')
    }

    console.log(`✅ Documento processado: ${result.chunksCount} chunks criados`)
    return result

  } catch (error) {
    console.error('❌ Erro ao processar documento:', error)
    throw error
  }
}

export async function reprocessDocument(documentId: string) {
  try {
    console.log(`🔄 Reprocessando documento ${documentId}`)

    const response = await fetch('/api/knowledge/process', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ documentId }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao reprocessar documento')
    }

    console.log(`✅ Documento reprocessado: ${result.chunksCount} chunks criados`)
    return result

  } catch (error) {
    console.error('❌ Erro ao reprocessar documento:', error)
    throw error
  }
}
