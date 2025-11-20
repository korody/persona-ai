'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

export default function DebugContextPage() {
  const [message, setMessage] = useState('Quais alimentos são bons para o baço?')
  const [avatarSlug, setAvatarSlug] = useState('mestre-ye')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function testContext() {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Você precisa estar logado!')
      }

      const response = await fetch('/api/debug/context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userMessage: message,
          avatarSlug: avatarSlug
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro na requisição')
      }

      const data = await response.json()
      setResult(data)

    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">🔍 Debug de Contexto da IA</h1>
          <p className="text-muted-foreground">
            Esta ferramenta mostra exatamente o que está sendo enviado para a IA: base de conhecimento, 
            dados da anamnese e exemplos de conversa.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuração do Teste</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">💬 Mensagem de Teste</label>
              <Textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ex: Quais alimentos são bons para o baço?"
                className="min-h-[100px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">🤖 Avatar (slug)</label>
              <Input 
                value={avatarSlug}
                onChange={(e) => setAvatarSlug(e.target.value)}
              />
            </div>

            <Button 
              onClick={testContext} 
              disabled={loading}
              className="w-full"
            >
              {loading ? '⏳ Carregando...' : '🔍 Testar Contexto'}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive font-semibold">❌ Erro: {error}</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <div className="space-y-6">
            <Card className="border-green-500">
              <CardContent className="pt-6">
                <p className="text-green-500 font-semibold">✅ Contexto carregado com sucesso!</p>
              </CardContent>
            </Card>

            {/* Anamnese */}
            <Card>
              <CardHeader>
                <CardTitle>🩺 Dados da Anamnese</CardTitle>
              </CardHeader>
              <CardContent>
                {result.hasAnamnese && result.anamneseData ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted p-3 rounded">
                      <div className="text-sm text-muted-foreground">Nome</div>
                      <div className="font-semibold">{result.anamneseData.nome}</div>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <div className="text-sm text-muted-foreground">Elemento</div>
                      <div className="font-semibold">{result.anamneseData.elementoPrincipal}</div>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <div className="text-sm text-muted-foreground">Intensidade</div>
                      <div className="font-semibold">{result.anamneseData.intensidade}</div>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <div className="text-sm text-muted-foreground">Data</div>
                      <div className="font-semibold">
                        {new Date(result.anamneseData.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma anamnese encontrada para este usuário.</p>
                )}
              </CardContent>
            </Card>

            {/* Base de Conhecimento */}
            <Card>
              <CardHeader>
                <CardTitle>📚 Base de Conhecimento Encontrada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 flex-wrap">
                  <Badge variant="outline">Total: {result.knowledge.totalFound} documentos</Badge>
                  <Badge variant="outline">Threshold: {result.knowledge.threshold * 100}%</Badge>
                  <Badge variant="outline">Máximo: {result.knowledge.maxResults}</Badge>
                </div>

                {result.knowledge.results.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Documentos retornados:</h3>
                    {result.knowledge.results.map((item: any, i: number) => (
                      <div key={i} className="bg-muted p-4 rounded-lg border-l-4 border-blue-500">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{i + 1}. {item.title}</span>
                            <Badge className="bg-green-500 text-white">{item.similarity}</Badge>
                            {item.isPrimary && (
                              <Badge variant="destructive">Elemento Principal</Badge>
                            )}
                            {item.isSecondary && (
                              <Badge className="bg-orange-500">Elemento Secundário</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          Categoria: {item.category || 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground italic">
                          {item.contentPreview}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhum documento relevante encontrado.</p>
                )}
              </CardContent>
            </Card>

            {/* Exemplos */}
            <Card>
              <CardHeader>
                <CardTitle>💬 Exemplos de Conversas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Badge variant="outline">Total: {result.examples.totalFound} exemplos</Badge>

                {result.examples.results.length > 0 ? (
                  <div className="space-y-3">
                    {result.examples.results.map((item: any, i: number) => (
                      <div key={i} className="bg-muted p-4 rounded-lg border-l-4 border-purple-500">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">{i + 1}. {item.title}</span>
                          <Badge className="bg-green-500 text-white">{item.similarity}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground italic">
                          {item.messagePreview}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhum exemplo encontrado.</p>
                )}
              </CardContent>
            </Card>

            {/* Estatísticas do Prompt */}
            <Card>
              <CardHeader>
                <CardTitle>📊 Estatísticas do Prompt Final</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 flex-wrap">
                  <Badge variant="outline">
                    Caracteres: {result.finalPrompt.characterCount.toLocaleString()}
                  </Badge>
                  <Badge variant="outline">
                    Palavras: {result.finalPrompt.wordCount.toLocaleString()}
                  </Badge>
                  <Badge variant={result.finalPrompt.sections.hasAnamneseSection ? "default" : "secondary"}>
                    Anamnese: {result.finalPrompt.sections.hasAnamneseSection ? '✅' : '❌'}
                  </Badge>
                  <Badge variant={result.finalPrompt.sections.hasKnowledgeSection ? "default" : "secondary"}>
                    Conhecimento: {result.finalPrompt.sections.hasKnowledgeSection ? '✅' : '❌'}
                  </Badge>
                  <Badge variant={result.finalPrompt.sections.hasExamplesSection ? "default" : "secondary"}>
                    Exemplos: {result.finalPrompt.sections.hasExamplesSection ? '✅' : '❌'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Prompt Completo */}
            <Card>
              <CardHeader>
                <CardTitle>📝 Prompt Completo Enviado para a IA</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs whitespace-pre-wrap max-h-[600px] overflow-y-auto">
                  {result.finalPrompt.fullText}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
