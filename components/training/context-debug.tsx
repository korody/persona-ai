'use client'

/**
 * Componente de Debug de Contexto da IA
 * Mostra detalhes sobre o que está sendo enviado para a IA
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  FileText, 
  Database, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

interface ContextDebugProps {
  testMessage: string
  onTest: () => Promise<DebugData | null>
}

interface DebugData {
  anamnese: {
    nome: string
    elemento: string
    intensidade: number
    data: string
  }
  knowledgeBase: {
    total: number
    threshold: number
    maxDocs: number
  }
  exercisesFound?: Array<{
    title: string
    course: string
    similarity: number
    level: string
    element: string
    duration_minutes: number
    enabled: boolean
  }>
  conversationContext: {
    messageCount: number
    lastUserMessage: string
  }
}

export function ContextDebug({ testMessage, onTest }: ContextDebugProps) {
  const [loading, setLoading] = useState(false)
  const [debugData, setDebugData] = useState<DebugData | null>(null)
  const [expanded, setExpanded] = useState(false)

  const handleTest = async () => {
    setLoading(true)
    try {
      const data = await onTest()
      setDebugData(data)
      setExpanded(true)
    } catch (error) {
      console.error('Error testing context:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-green-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-green-600" />
            <CardTitle className="text-lg">Debug de Contexto da IA</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="gap-1"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Recolher
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Expandir
              </>
            )}
          </Button>
        </div>
        <CardDescription>
          Esta ferramenta mostra exatamente o que está sendo enviado para a IA: base de conhecimento, dados da anamnese e exemplos de conversa
        </CardDescription>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Test Configuration */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Configuração do Teste</h3>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm">
                <span className="font-medium">💬 Mensagem de Teste:</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {testMessage || 'Digite uma mensagem para testar'}
              </p>
            </div>
          </div>

          {/* Test Button */}
          <Button 
            onClick={handleTest} 
            disabled={loading || !testMessage.trim()}
            className="w-full gap-2"
            variant="default"
          >
            {loading ? (
              <>
                <Search className="w-4 h-4 animate-spin" />
                Testando Contexto...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                🔍 Testar Contexto
              </>
            )}
          </Button>

          {/* Debug Results */}
          {debugData && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-semibold">Contexto carregado com sucesso!</h3>
              </div>

              {/* Anamnese Data */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <h4 className="font-semibold text-sm">🩺 Dados da Anamnese</h4>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-xs text-muted-foreground">Nome</p>
                    <p className="font-medium text-sm">{debugData.anamnese.nome}</p>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-xs text-muted-foreground">Elemento</p>
                    <Badge variant="outline">{debugData.anamnese.elemento}</Badge>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-xs text-muted-foreground">Intensidade</p>
                    <p className="font-medium text-sm">{debugData.anamnese.intensidade}/10</p>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-xs text-muted-foreground">Data</p>
                    <p className="font-medium text-sm">{debugData.anamnese.data}</p>
                  </div>
                </div>
              </div>

              {/* Knowledge Base Stats */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <h4 className="font-semibold text-sm">📚 Base de Conhecimento Encontrada</h4>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-purple-50 dark:bg-purple-950/20 rounded p-2 border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-purple-600 dark:text-purple-400">Total</p>
                    <p className="font-bold text-lg text-purple-700 dark:text-purple-300">
                      {debugData.knowledgeBase.total}
                    </p>
                    <p className="text-xs text-purple-600/70">documentos</p>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-xs text-muted-foreground">Threshold</p>
                    <p className="font-medium text-sm">{debugData.knowledgeBase.threshold}%</p>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-xs text-muted-foreground">Máximo</p>
                    <p className="font-medium text-sm">{debugData.knowledgeBase.maxDocs}</p>
                  </div>
                </div>
              </div>

              {/* Exercises Found */}
              {debugData.exercisesFound && debugData.exercisesFound.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-600" />
                    <h4 className="font-semibold text-sm">
                      🎯 Exercícios Recomendados ({debugData.exercisesFound.length})
                    </h4>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {debugData.exercisesFound.map((exercise, idx) => (
                      <div 
                        key={idx} 
                        className="bg-muted/50 rounded p-3 space-y-2 border"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{exercise.title}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {exercise.course}
                            </p>
                          </div>
                          {exercise.enabled ? (
                            <Badge variant="default" className="shrink-0 gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="shrink-0 gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Inativo
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {exercise.level}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {exercise.element}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {exercise.duration_minutes}min
                          </Badge>
                          <div className="ml-auto">
                            <Badge variant="secondary" className="text-xs">
                              {(exercise.similarity * 100).toFixed(1)}% match
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversation Context */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-600" />
                  <h4 className="font-semibold text-sm">💬 Contexto da Conversa</h4>
                </div>
                <div className="bg-muted/50 rounded p-3">
                  <p className="text-xs text-muted-foreground mb-1">Mensagens na conversa</p>
                  <p className="font-medium text-sm">{debugData.conversationContext.messageCount}</p>
                  <p className="text-xs text-muted-foreground mt-2 mb-1">Última mensagem do usuário</p>
                  <p className="text-sm italic">&ldquo;{debugData.conversationContext.lastUserMessage}&rdquo;</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
