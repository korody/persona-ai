import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Upload, FileText, Brain, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function TrainingPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth?redirect=/admin/training')
  }

  const allowedAdminEmails = [
    'marko@persona.cx',
    'admin@qigongbrasil.com'
  ]
  
  if (!allowedAdminEmails.includes(user.email || '')) {
    redirect('/chat')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Treinamento do Avatar</h1>
                <p className="text-muted-foreground">Mestre Ye Digital</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            🚧 <strong>Em Desenvolvimento</strong> - Esta funcionalidade estará disponível em breve.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload de Documentos */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Upload className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold">Upload de Documentos</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Faça upload de PDFs, documentos e materiais para treinar o avatar.
            </p>
            <Button disabled className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Fazer Upload (Em breve)
            </Button>
          </div>

          {/* Base de Conhecimento */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-6 w-6 text-green-500" />
              <h2 className="text-xl font-bold">Base de Conhecimento</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Gerencie documentos e conteúdos da base de conhecimento.
            </p>
            <Button disabled variant="outline" className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Ver Documentos (Em breve)
            </Button>
          </div>

          {/* Configuração de Personalidade */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-bold">Personalidade</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Configure o tom de voz e comportamento do avatar.
            </p>
            <Button disabled variant="outline" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Configurar (Em breve)
            </Button>
          </div>

          {/* Teste de Qualidade */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="h-6 w-6 text-purple-500" />
              <h2 className="text-xl font-bold">Teste de Qualidade</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Teste a qualidade das respostas do avatar.
            </p>
            <Button disabled variant="outline" className="w-full">
              <Brain className="h-4 w-4 mr-2" />
              Testar Avatar (Em breve)
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

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
