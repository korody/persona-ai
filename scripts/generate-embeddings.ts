import { runBatchGenerateEmbeddings } from '../lib/ai/actions'

async function main() {
	console.log('\n🧠 GERANDO EMBEDDINGS PARA BUSCA SEMÂNTICA\n')
	console.log('='.repeat(70))

	try {
		const result = await runBatchGenerateEmbeddings()

		// Resumo
		console.log('\n' + '='.repeat(70))
		console.log('\n📊 RESUMO:\n')
		console.log(`   ✅ Sucesso: ${result.generated}`)
		console.log(`   ⏭️  Pulados: ${result.skipped}`)
		console.log(`   ❌ Erros: ${result.errors}`)
		console.log(`   📦 Total: ${result.total}\n`)

		if (result.generated > 0) {
			console.log('🎉 Embeddings gerados com sucesso!')
			console.log('🔍 Busca semântica agora disponível\n')
		}
	} catch (error) {
		console.error('\n❌ Erro fatal:', error)
		process.exit(1)
	}
}

main()
