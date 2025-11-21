/**
 * Memberkit Sync Script
 * Script para sincronizar dados do Memberkit
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { syncExercises } from '../lib/memberkit/sync'
import type { ExercisesMetadataFile } from '../lib/memberkit/types'

// ============================================
// MAIN SCRIPT
// ============================================

async function main() {
  console.log('\n🚀 SCRIPT DE SINCRONIZAÇÃO MEMBERKIT\n')
  console.log('='.repeat(70))

  try {
    // 1. Ler arquivo de metadata
    console.log('\n📄 Lendo exercicios-metadata.json...')
    const metadataPath = join(process.cwd(), 'exercicios-metadata.json')
    
    let metadata: ExercisesMetadataFile['exercicios'] = {}

    if (existsSync(metadataPath)) {
      const fileContent = readFileSync(metadataPath, 'utf-8')
      const metadataFile: ExercisesMetadataFile = JSON.parse(fileContent)
      metadata = metadataFile.exercicios || {}
      
      const metadataCount = Object.keys(metadata).length
      console.log(`✅ Metadata carregada: ${metadataCount} exercício(s) com metadata customizada`)
    } else {
      console.log('⚠️  Arquivo exercicios-metadata.json não encontrado')
      console.log('   Sincronização continuará sem metadata customizada')
    }

    // 2. Executar sincronização
    const result = await syncExercises(metadata)

    // 3. Exibir resultado
    console.log('\n✅ SINCRONIZAÇÃO CONCLUÍDA!\n')
    console.log(`   Total processado: ${result.total}`)
    console.log(`   Sucessos: ${result.sucesso}`)
    console.log(`   Erros: ${result.erros.length}`)

    // 4. Exit code baseado no resultado
    if (result.erros.length > 0) {
      console.log('\n⚠️  Sincronização completada com erros')
      process.exit(1)
    } else {
      console.log('\n🎉 Sincronização 100% bem-sucedida!')
      process.exit(0)
    }

  } catch (error) {
    console.error('\n❌ ERRO FATAL:\n')
    console.error(error)
    console.log('\n' + '='.repeat(70) + '\n')
    process.exit(1)
  }
}

// Executar
main()
