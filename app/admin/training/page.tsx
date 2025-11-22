'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Save, Trash2, Edit2, BookOpen, MessageSquare, FileText } from 'lucide-react'

export default function AdminTrainingPage() {
  const [avatar, setAvatar] = useState<any>(null)
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [knowledge, setKnowledge] = useState<any[]>([])
  const [examples, setExamples] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const supabase = createClient()
      // MODO DEV: dados mockados enquanto autenticação não funciona
      const mockAvatar = {
        id: '1',
        name: 'Mestre Ye',
        slug: 'mestre-ye',
        system_prompt: `Você é o Mestre Ye Digital, especialista em Medicina Tradicional Chinesa e nos 5 Elementos.

Sua missão é:
- Avaliar desequilíbrios energéticos através de perguntas sobre sintomas
- Recomendar exercícios personalizados baseados no Método Ye Yin
- Ensinar práticas de autocuidado e harmonização energética

Tom de voz: Acolhedor, empático, educativo, mas sempre profissional.

IMPORTANTE:
- Sempre pergunte sobre sintomas físicos e emocionais
- Identifique o elemento dominante (Madeira, Fogo, Terra, Metal, Água)
- Recomende exercícios específicos para o desequilíbrio
- Nunca substitua diagnóstico médico profissional`
      }
      
      setAvatar(mockAvatar)
      setCurrentPrompt(mockAvatar.system_prompt)
      setKnowledge([])
      setExamples([])
      
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePrompt = async () => {
    try {
      // MODO DEV: apenas mostrar sucesso sem salvar no servidor
      localStorage.setItem('dev-avatar-prompt', currentPrompt)
      alert('✅ Prompt salvo localmente (modo desenvolvimento)!')
    } catch (error) {
      console.error('Error saving prompt:', error)
      alert('❌ Erro ao salvar')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Treinamento do Avatar</h1>
        <p className="text-muted-foreground">
          Gerencie o conhecimento, personalidade e exemplos de conversas do {avatar?.name}
        </p>
      </div>

      <Tabs defaultValue="prompt" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prompt" className="gap-2">
            <FileText className="h-4 w-4" />
            Prompt do Sistema
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Base de Conhecimento
          </TabsTrigger>
          <TabsTrigger value="examples" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Exemplos de Conversas
          </TabsTrigger>
        </TabsList>

        {/* TAB: Prompt do Sistema */}
        <TabsContent value="prompt">
          <Card>
            <CardHeader>
              <CardTitle>Prompt do Sistema</CardTitle>
              <CardDescription>
                Define a personalidade, expertise e comportamento do avatar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prompt">System Prompt</Label>
                <Textarea
                  id="prompt"
                  value={currentPrompt}
                  onChange={(e) => setCurrentPrompt(e.target.value)}
                  rows={20}
                  className="font-mono text-sm mt-2"
                  placeholder="Você é o Mestre Ye..."
                />
                <p className="text-sm text-muted-foreground mt-2">
                  {currentPrompt.length} caracteres
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={savePrompt} className="gap-2">
                  <Save className="h-4 w-4" />
                  Salvar Prompt
                </Button>
                <Button variant="outline" onClick={loadData}>
                  Cancelar
                </Button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h4 className="font-semibold mb-2">💡 Dicas para um bom prompt:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Defina claramente quem é o avatar (nome, experiência, especialidade)</li>
                  <li>• Liste as principais responsabilidades e objetivos</li>
                  <li>• Especifique o tom de voz e estilo de comunicação</li>
                  <li>• Inclua restrições e o que NÃO fazer</li>
                  <li>• Dê exemplos de como deve responder</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Base de Conhecimento */}
        <TabsContent value="knowledge">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Base de Conhecimento</CardTitle>
                  <CardDescription>
                    Documentos, artigos e informações que o avatar pode consultar (RAG)
                  </CardDescription>
                </div>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Documento
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {knowledge.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum documento adicionado ainda</p>
                  <p className="text-sm mt-2">
                    Adicione artigos, guias e exercícios para enriquecer o conhecimento do avatar
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {knowledge.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{item.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.content.substring(0, 200)}...
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{item.content_type}</Badge>
                            {item.tags?.map((tag: string) => (
                              <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-1 ml-4">
                          <Button variant="ghost" size="icon">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Exemplos de Conversas */}
        <TabsContent value="examples">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Exemplos de Conversas</CardTitle>
                  <CardDescription>
                    Pares pergunta/resposta ideais para orientar o comportamento do avatar
                  </CardDescription>
                </div>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Exemplo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {examples.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum exemplo adicionado ainda</p>
                  <p className="text-sm mt-2">
                    Adicione exemplos de conversas ideais para treinar o avatar
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {examples.map((example) => (
                    <div
                      key={example.id}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <Badge>{example.category || 'Geral'}</Badge>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded">
                        <p className="text-sm font-semibold mb-1">👤 Usuário:</p>
                        <p className="text-sm">{example.user_message}</p>
                      </div>

                      <div className="bg-green-50 dark:bg-green-950 p-3 rounded">
                        <p className="text-sm font-semibold mb-1">🤖 {avatar?.name}:</p>
                        <p className="text-sm">{example.avatar_response}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
