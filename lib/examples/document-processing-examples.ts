/**
 * Exemplo de uso do processamento automático de documentos
 * 
 * Este arquivo demonstra como integrar o processamento automático
 * de chunks em seu componente de upload existente.
 */

import { processDocumentAfterUpload, reprocessDocument } from '@/lib/hooks/use-document-processing'

// ============================================================================
// EXEMPLO 1: No componente de upload
// ============================================================================

export async function handleDocumentUpload(file: File, avatarId: string) {
  try {
    // 1. Fazer upload do documento (sua lógica existente)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('avatar_id', avatarId)

    const uploadResponse = await fetch('/api/knowledge/upload', {
      method: 'POST',
      body: formData,
    })

    const { documentId } = await uploadResponse.json()

    // 2. ✨ PROCESSAR AUTOMATICAMENTE (chunks + embeddings)
    const result = await processDocumentAfterUpload(documentId)

    console.log(`✅ Upload completo! ${result.chunksCount} chunks criados`)
    
    return {
      documentId,
      chunksCount: result.chunksCount,
      elemento: result.elemento
    }

  } catch (error) {
    console.error('Erro no upload:', error)
    throw error
  }
}

// ============================================================================
// EXEMPLO 2: Reprocessar documento existente (botão na UI)
// ============================================================================

export async function handleReprocessDocument(documentId: string) {
  try {
    const result = await reprocessDocument(documentId)
    
    console.log(`✅ Documento reprocessado! ${result.chunksCount} chunks`)
    
    return result

  } catch (error) {
    console.error('Erro ao reprocessar:', error)
    throw error
  }
}

// ============================================================================
// EXEMPLO 3: Componente React com feedback visual
// ============================================================================

/*
'use client'

import { useState } from 'react'
import { processDocumentAfterUpload } from '@/lib/hooks/use-document-processing'

export function DocumentUploadButton() {
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function handleUpload(file: File) {
    try {
      setUploading(true)

      // Upload do arquivo
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await fetch('/api/knowledge/upload', {
        method: 'POST',
        body: formData,
      })

      const { documentId } = await uploadRes.json()
      setUploading(false)

      // Processar chunks automaticamente
      setProcessing(true)
      const processResult = await processDocumentAfterUpload(documentId)
      setProcessing(false)

      setResult(processResult)
      
    } catch (error) {
      console.error(error)
      setUploading(false)
      setProcessing(false)
    }
  }

  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleUpload(e.target.files[0])
          }
        }}
        disabled={uploading || processing}
      />

      {uploading && <p>📤 Fazendo upload...</p>}
      {processing && <p>🔄 Processando chunks...</p>}
      {result && (
        <p>✅ Concluído! {result.chunksCount} chunks criados para elemento {result.elemento}</p>
      )}
    </div>
  )
}
*/

// ============================================================================
// EXEMPLO 4: Processar múltiplos documentos em lote
// ============================================================================

export async function processMultipleDocuments(documentIds: string[]) {
  const results = []

  for (const docId of documentIds) {
    try {
      const result = await processDocumentAfterUpload(docId)
      results.push({ documentId: docId, success: true, ...result })
    } catch (error: any) {
      results.push({ documentId: docId, success: false, error: error.message })
    }
  }

  return results
}

// ============================================================================
// EXEMPLO 5: Verificar e processar documentos pendentes
// ============================================================================

export async function processPendingDocuments(avatarId: string) {
  try {
    // Buscar documentos sem chunks
    const response = await fetch(`/api/knowledge/pending?avatar_id=${avatarId}`)
    const { documents } = await response.json()

    console.log(`📄 Encontrados ${documents.length} documentos pendentes`)

    // Processar cada um
    const results = await processMultipleDocuments(documents.map((d: any) => d.id))

    const succeeded = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    console.log(`✅ ${succeeded} processados, ❌ ${failed} falharam`)

    return results

  } catch (error) {
    console.error('Erro ao processar pendentes:', error)
    throw error
  }
}
