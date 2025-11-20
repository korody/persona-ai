'use client'

/**
 * Aba de Exemplos de Conversas
 * Few-shot learning - Exemplos de como o avatar deve responder
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, MessageSquare, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Example {
  id: string
  user_message: string
  assistant_response: string
  category?: string
  tags: string[]
  is_active: boolean
  order_index: number
  created_at: string
}

interface ExamplesTabProps {
  avatarId: string
}

export function ExamplesTab({ avatarId }: ExamplesTabProps) {
  const [examples, setExamples] = useState<Example[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [userMessage, setUserMessage] = useState('')
  const [assistantResponse, setAssistantResponse] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')

  useEffect(() => {
    loadExamples()
  }, [avatarId])

  async function loadExamples() {
    try {
      setLoading(true)
      const res = await fetch(`/api/avatar-training/examples?avatar_id=${avatarId}`)
      const data = await res.json()
      
      if (data.examples) {
        setExamples(data.examples)
      }
    } catch (error) {
      console.error('Error loading examples:', error)
      toast.error('Erro ao carregar exemplos')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddExample() {
    if (!userMessage.trim() || !assistantResponse.trim()) {
      toast.error('Preencha mensagem do usuário e resposta')
      return
    }

    try {
      setSubmitting(true)
      
      const tagArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

      const res = await fetch('/api/avatar-training/examples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatar_id: avatarId,
          user_message: userMessage,
          assistant_response: assistantResponse,
          category: category || null,
          tags: tagArray,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Exemplo adicionado!')
        setUserMessage('')
        setAssistantResponse('')
        setCategory('')
        setTags('')
        loadExamples()
      } else {
        toast.error(data.error || 'Erro ao adicionar')
      }
    } catch (error) {
      console.error('Error adding example:', error)
      toast.error('Erro ao adicionar exemplo')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja deletar este exemplo?')) {
      return
    }

    try {
      const res = await fetch(`/api/avatar-training/examples?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Exemplo removido')
        loadExamples()
      } else {
        toast.error('Erro ao remover')
      }
    } catch (error) {
      console.error('Error deleting example:', error)
      toast.error('Erro ao remover exemplo')
    }
  }

  async function handleToggleActive(id: string, currentState: boolean) {
    try {
      const res = await fetch('/api/avatar-training/examples', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          is_active: !currentState,
        }),
      })

      if (res.ok) {
        toast.success(currentState ? 'Exemplo desativado' : 'Exemplo ativado')
        loadExamples()
      } else {
        toast.error('Erro ao atualizar')
      }
    } catch (error) {
      console.error('Error toggling example:', error)
      toast.error('Erro ao atualizar exemplo')
    }
  }

  return (
    <div className="space-y-6">
      {/* Formulário de Adição */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Exemplo de Conversa</CardTitle>
          <CardDescription>
            Mostre ao avatar como deve responder em situações específicas (Few-shot Learning)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria (opcional)</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: diagnóstico, tratamento"
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="example-tags">Tags (separadas por vírgula)</Label>
              <Input
                id="example-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="ansiedade, diagnóstico"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-message">Mensagem do Usuário</Label>
            <Textarea
              id="user-message"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="Ex: Tenho insônia há semanas, o que pode ser?"
              rows={3}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assistant-response">Resposta do Avatar</Label>
            <Textarea
              id="assistant-response"
              value={assistantResponse}
              onChange={(e) => setAssistantResponse(e.target.value)}
              placeholder="Ex: A insônia pode estar relacionada a diferentes elementos. Se você também tem ansiedade..."
              rows={6}
              disabled={submitting}
              className="font-mono text-sm"
            />
          </div>

          <Button
            onClick={handleAddExample}
            disabled={submitting || !userMessage.trim() || !assistantResponse.trim()}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Exemplo
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Exemplos */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Exemplos Cadastrados ({examples.length})
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : examples.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Nenhum exemplo adicionado ainda
              </p>
            </CardContent>
          </Card>
        ) : (
          examples.map((example) => (
            <Card key={example.id} className={!example.is_active ? 'opacity-50' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {example.category && (
                      <Badge variant="outline">{example.category}</Badge>
                    )}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={example.is_active}
                        onCheckedChange={() => handleToggleActive(example.id, example.is_active)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {example.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(example.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MessageSquare className="w-4 h-4" />
                    Usuário:
                  </div>
                  <p className="text-sm pl-6 bg-muted p-3 rounded">
                    {example.user_message}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <MessageSquare className="w-4 h-4" />
                    Avatar:
                  </div>
                  <p className="text-sm pl-6 bg-primary/5 p-3 rounded border border-primary/20">
                    {example.assistant_response}
                  </p>
                </div>

                {example.tags && example.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {example.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
