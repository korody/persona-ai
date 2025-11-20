'use client'

/**
 * Aba de Base de Conhecimento
 * Estrutura organizada por categorias como na Lista Mestra
 */

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Upload, 
  FileText, 
  Plus, 
  Trash2,
  Brain,
  User,
  Lightbulb,
  CheckCircle2,
  Circle,
  Clock,
  Edit2,
  FileQuestion,
  X,
  ChevronDown,
  ChevronUp,
  Download,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface KnowledgeItem {
  id: string
  title: string
  content: string
  content_type?: string
  category?: string | null
  priority?: 'CRITICO' | 'ESSENCIAL' | 'DESEJAVEL' | null
  metadata?: {
    category?: string
    priority?: 'CRITICO' | 'ESSENCIAL' | 'DESEJAVEL'
    [key: string]: any
  }
  tags: string[]
  created_at: string
}

const CATEGORIES = [
  {
    id: '1-identidade',
    icon: User,
    title: '1. Identidade',
    description: 'Quem é o especialista, sua história e personalidade',
    color: 'purple',
    emoji: '👤'
  },
  {
    id: '2-conhecimento',
    icon: Brain,
    title: '2. Conhecimento Técnico',
    description: 'Base de conhecimento especializado da área',
    color: 'blue',
    emoji: '🧠'
  },
  {
    id: '3-seguranca',
    icon: Brain,
    title: '3. Segurança',
    description: '⚠️ Contraindicações e limites',
    color: 'red',
    emoji: '🛡️'
  },
  {
    id: '4-experiencia',
    icon: User,
    title: '4. Experiência do Usuário',
    description: 'Como o usuário interage e progride',
    color: 'green',
    emoji: '👥'
  },
  {
    id: '5-contexto',
    icon: Brain,
    title: '5. Contexto',
    description: 'Informações de suporte e integrações',
    color: 'indigo',
    emoji: '📚'
  },
  {
    id: 'nao-categorizado',
    icon: FileQuestion,
    title: 'Não Categorizado',
    description: 'Documentos sem categoria definida',
    color: 'gray',
    emoji: '❓'
  }
]

// Documentos sugeridos por categoria
const SUGGESTED_DOCS = {
  '1-identidade': [
    {
      id: 'biografia-completa',
      title: 'Biografia completa',
      description: 'Nome, formação, história de vida, momento de virada, missão pessoal.',
      priority: 'CRITICO'
    },
    {
      id: 'filosofia-crencas',
      title: 'Filosofia e crenças',
      description: '5-7 crenças fundamentais, 3-5 heresias, valores inegociáveis.',
      priority: 'CRITICO'
    },
    {
      id: 'personalidade-tom',
      title: 'Personalidade e tom',
      description: 'Tom de voz, frases características, o que NUNCA diz/faz.',
      priority: 'ESSENCIAL'
    },
    {
      id: 'padroes-linguisticos',
      title: 'Padrões linguísticos',
      description: 'Estrutura de respostas, analogias preferidas, vocabulário característico.',
      priority: 'ESSENCIAL'
    }
  ],
  '2-conhecimento': [
    {
      id: 'dominio-tecnico',
      title: 'Domínio técnico (3-10 docs)',
      description: 'Conhecimento técnico principal. Ex: elementos da MTC, macronutrientes, anatomia, etc.',
      priority: 'CRITICO'
    },
    {
      id: 'protocolos-metodos',
      title: 'Protocolos e métodos',
      description: 'Seu método proprietário, fases de aplicação, critérios de progressão.',
      priority: 'ESSENCIAL'
    },
    {
      id: 'exercicios-praticos',
      title: 'Exercícios práticos (5-15 docs)',
      description: 'UM arquivo por exercício/técnica. Passo a passo MUITO detalhado.',
      priority: 'ESSENCIAL'
    },
    {
      id: 'recursos-complementares',
      title: 'Recursos complementares',
      description: 'Receitas, planos, rotinas, meditações, scripts, checklists.',
      priority: 'DESEJAVEL'
    }
  ],
  '3-seguranca': [
    {
      id: 'protocolos-seguranca',
      title: 'Protocolos de segurança',
      description: 'Contraindicações absolutas/relativas, sinais de alerta, quando encaminhar, disclaimers.',
      priority: 'CRITICO'
    },
    {
      id: 'limites-atuacao',
      title: 'Limites de atuação',
      description: 'O que PODE fazer no digital vs. o que NÃO PODE, compliance legal.',
      priority: 'ESSENCIAL'
    }
  ],
  '4-experiencia': [
    {
      id: 'perguntas-frequentes',
      title: 'Perguntas frequentes',
      description: '15-30 perguntas frequentes com respostas honestas e realistas.',
      priority: 'ESSENCIAL'
    },
    {
      id: 'casos-estudo',
      title: 'Casos de estudo (3-10 docs)',
      description: 'Perfil inicial, abordagem, evolução cronológica, resultado final. Anonimizar!',
      priority: 'ESSENCIAL'
    },
    {
      id: 'guia-progressao',
      title: 'Guia de progressão',
      description: 'Fases (iniciante/intermediário/avançado/manutenção), sinais de progresso.',
      priority: 'ESSENCIAL'
    }
  ],
  '5-contexto': [
    {
      id: 'glossario-tecnico',
      title: 'Glossário técnico',
      description: '20-50 termos técnicos com definição simples e exemplo prático.',
      priority: 'ESSENCIAL'
    },
    {
      id: 'integracoes-multidisciplinares',
      title: 'Integrações multidisciplinares',
      description: 'Quando usuário precisa de múltiplas abordagens (MTC + Fisio, Nutri + Psico).',
      priority: 'DESEJAVEL'
    },
    {
      id: 'calendario-sazonalidade',
      title: 'Calendário e sazonalidade',
      description: 'Sazonalidade se aplicável (estações MTC, alimentos sazonais, etc).',
      priority: 'DESEJAVEL'
    }
  ]
}

const STATUS_CONFIG = {
  pending: { label: 'Pendente', icon: Circle, color: 'text-orange-500' },
  added: { label: 'Adicionado', icon: CheckCircle2, color: 'text-green-500' }
}

const PRIORITY_CONFIG = {
  CRITICO: { label: 'Crítico', color: 'bg-red-500/10 text-red-600 border-red-500' },
  ESSENCIAL: { label: 'Essencial', color: 'bg-orange-500/10 text-orange-600 border-orange-500' },
  DESEJAVEL: { label: 'Desejável', color: 'bg-blue-500/10 text-blue-600 border-blue-500' }
}

interface KnowledgeTabProps {
  avatarId: string
}

export function KnowledgeTab({ avatarId }: KnowledgeTabProps) {
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'category' | 'priority'>('category')
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [avatarName, setAvatarName] = useState<string>('[nome-avatar]')
  const [completedSuggestions, setCompletedSuggestions] = useState<Set<string>>(new Set())
  const [collapsedSections, setCollapsedSections] = useState<Record<string, { suggested: boolean; added: boolean }>>({})
  
  // Add Document Dialog State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [addMode, setAddMode] = useState<'manual' | 'upload'>('manual')
  const [preSelectedCategory, setPreSelectedCategory] = useState<string | null>(null)
  
  // Manual Add Form
  const [manualTitle, setManualTitle] = useState('')
  const [manualContent, setManualContent] = useState('')
  const [manualTags, setManualTags] = useState('')
  const [manualCategory, setManualCategory] = useState<string>('1')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Upload Form
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadTags, setUploadTags] = useState('')
  const [uploadCategory, setUploadCategory] = useState<string>('1')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Carregar conhecimento e nome do avatar
  useEffect(() => {
    loadKnowledge()
    loadAvatarName()
    loadCompletedFromLocalStorage()
    loadCollapsedStateFromLocalStorage()
  }, [avatarId])

  // Carregar estado do localStorage
  function loadCompletedFromLocalStorage() {
    const saved = localStorage.getItem(`persona-ai-completed-suggestions-${avatarId}`)
    if (saved) {
      setCompletedSuggestions(new Set(JSON.parse(saved)))
    }
  }

  // Carregar estado de collapse do localStorage
  function loadCollapsedStateFromLocalStorage() {
    const saved = localStorage.getItem(`persona-ai-collapsed-sections-${avatarId}`)
    if (saved) {
      setCollapsedSections(JSON.parse(saved))
    } else {
      // Estado inicial: tudo fechado
      const initialState: Record<string, { suggested: boolean; added: boolean }> = {}
      CATEGORIES.forEach(cat => {
        initialState[cat.id] = { suggested: true, added: true }
      })
      setCollapsedSections(initialState)
    }
  }

  // Salvar estado no localStorage
  function saveCompletedToLocalStorage(completedSet: Set<string>) {
    localStorage.setItem(`persona-ai-completed-suggestions-${avatarId}`, JSON.stringify([...completedSet]))
  }

  // Salvar estado de collapse no localStorage
  function saveCollapsedStateToLocalStorage(state: Record<string, { suggested: boolean; added: boolean }>) {
    localStorage.setItem(`persona-ai-collapsed-sections-${avatarId}`, JSON.stringify(state))
  }

  // Toggle collapse de seções
  const toggleSection = (categoryId: string, section: 'suggested' | 'added') => {
    setCollapsedSections(prev => {
      const newState = {
        ...prev,
        [categoryId]: {
          ...prev[categoryId],
          [section]: !prev[categoryId]?.[section]
        }
      }
      saveCollapsedStateToLocalStorage(newState)
      return newState
    })
  }

  async function loadAvatarName() {
    try {
      const res = await fetch(`/api/avatars/${avatarId}`)
      const data = await res.json()
      if (data.avatar?.name) {
        setAvatarName(data.avatar.name.toLowerCase().replace(/\s+/g, '-'))
      }
    } catch (error) {
      console.error('Error loading avatar name:', error)
    }
  }

  async function loadKnowledge() {
    try {
      setLoading(true)
      const res = await fetch(`/api/avatar-training/knowledge?avatar_id=${avatarId}`)
      const data = await res.json()
      
      if (data.knowledge) {
        // Normalizar dados - extrair category e priority do metadata
        const normalized = data.knowledge.map((item: any) => ({
          ...item,
          category: item.metadata?.category || item.category || null,
          priority: item.metadata?.priority || item.priority || null,
        }))
        
        console.log('📊 Total knowledge items:', normalized.length)
        console.log('📊 Template items:', normalized.filter((i: any) => i.metadata?.is_template).length)
        console.log('📊 Real items:', normalized.filter((i: any) => !i.metadata?.is_template).length)
        
        setKnowledge(normalized)
      }
    } catch (error) {
      console.error('Error loading knowledge:', error)
      toast.error('Erro ao carregar conhecimento')
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkSuggestedAsComplete(categoryId: string, docId: string, docTitle: string, docDescription: string, docPriority: string) {
    // Toggle: se já está marcado, desmarca; se não está, marca
    const newCompleted = new Set(completedSuggestions)
    
    if (newCompleted.has(docId)) {
      newCompleted.delete(docId)
      toast.success(`↩️ ${docTitle} desmarcado`)
    } else {
      newCompleted.add(docId)
      toast.success(`✅ ${docTitle} marcado como adicionado!`)
    }
    
    setCompletedSuggestions(newCompleted)
    saveCompletedToLocalStorage(newCompleted)
  }

  // Função para gerar e baixar template
  const handleDownloadTemplate = (docId: string, docTitle: string) => {
    const templates: Record<string, string> = {
      'biografia-completa': `# Biografia Completa - ${avatarName}

## Dados Pessoais
- **Nome completo**: 
- **Formação acadêmica**: 
- **Especializações**: 

## História de Vida
[Descreva a trajetória pessoal e profissional]

## Momento de Virada
[O que te levou a se especializar nesta área?]

## Missão Pessoal
[Qual o seu propósito ao ajudar pessoas?]

## Experiência Profissional
- Anos de atuação:
- Principais conquistas:
- Casos de sucesso:`,

      'filosofia-crencas': `# Filosofia e Crenças - ${avatarName}

## Crenças Fundamentais (5-7)
1. 
2. 
3. 
4. 
5. 

## Heresias (3-5)
[O que você acredita que contraria o senso comum da sua área?]
1. 
2. 
3. 

## Valores Inegociáveis
1. 
2. 
3. `,

      'personalidade-tom': `# Personalidade e Tom de Voz - ${avatarName}

## Tom de Voz
- [ ] Formal / Informal
- [ ] Técnico / Acessível
- [ ] Sério / Descontraído
- [ ] Direto / Elaborado

## Frases Características
[Liste 5-10 frases ou expressões que você usa frequentemente]
1. 
2. 
3. 

## O que NUNCA diz/faz
- 
- 
- `,

      'padroes-linguisticos': `# Padrões Linguísticos - ${avatarName}

## Estrutura de Respostas
[Como você organiza suas explicações?]

## Analogias Preferidas
[Quais comparações você usa com frequência?]
1. 
2. 
3. 

## Vocabulário Característico
[Termos técnicos e expressões específicas que você usa]
- 
- 
- `,

      'dominio-tecnico': `# Domínio Técnico - ${avatarName}

## Conceitos Fundamentais
[Liste e explique os principais conceitos da sua área]

### Conceito 1
**Definição**: 
**Aplicação prática**: 
**Exemplos**: 

### Conceito 2
**Definição**: 
**Aplicação prática**: 
**Exemplos**: 

## Metodologias
[Descreva as metodologias que você utiliza]`,

      'protocolos-metodos': `# Protocolos e Métodos - ${avatarName}

## Método Proprietário
[Nome e descrição do seu método]

## Fases de Aplicação
### Fase 1:
- Objetivo:
- Duração:
- Atividades:

### Fase 2:
- Objetivo:
- Duração:
- Atividades:

## Critérios de Progressão
[Como saber quando avançar para a próxima fase?]
- 
- 
- `,

      'exercicios-praticos': `# Exercício: [Nome do Exercício]

## Objetivo
[Para que serve este exercício?]

## Indicações
[Quando usar este exercício?]
- 
- 

## Contraindicações
[Quando NÃO usar?]
- 
- 

## Passo a Passo DETALHADO
1. 
2. 
3. 
4. 
5. 

## Variações
[Adaptações possíveis]
- 
- 

## Erros Comuns
- 
- `,

      'recursos-complementares': `# Recursos Complementares - ${avatarName}

## Receitas/Protocolos
[Descreva receitas, planos alimentares, etc]

## Rotinas Recomendadas
[Rotinas diárias/semanais]

## Meditações/Práticas
[Scripts de meditação ou práticas guiadas]

## Checklists
[Listas de verificação úteis]`,

      'protocolos-seguranca': `# Protocolos de Segurança - ${avatarName}

## ⛔ Contraindicações Absolutas
[Situações onde NÃO deve atuar de forma alguma]
1. 
2. 
3. 

## ⚠️ Contraindicações Relativas
[Situações que requerem cautela ou adaptação]
1. 
2. 
3. 

## 🚨 Sinais de Alerta
[Quando encaminhar para outro profissional]
- 
- 
- 

## Disclaimers Obrigatórios
[Avisos legais que devem ser dados]
- 
- `,

      'limites-atuacao': `# Limites de Atuação - ${avatarName}

## ✅ O que PODE fazer no digital
- 
- 
- 

## ❌ O que NÃO PODE fazer
- 
- 
- 

## Compliance Legal
[Requisitos legais da sua profissão]
- 
- 

## Encaminhamentos
[Quando e para quem encaminhar]
- 
- `,

      'perguntas-frequentes': `# Perguntas Frequentes - ${avatarName}

## Pergunta 1: [Título]
**Resposta**: 

## Pergunta 2: [Título]
**Resposta**: 

## Pergunta 3: [Título]
**Resposta**: 

[Continue com mais 12-27 perguntas]`,

      'jornada-usuario': `# Jornada do Usuário - ${avatarName}

## Estágios da Jornada
### Estágio 1: [Nome]
- Duração estimada:
- Objetivos:
- Marcos:

### Estágio 2: [Nome]
- Duração estimada:
- Objetivos:
- Marcos:

## Primeiros Passos
[O que um novo usuário deve fazer primeiro?]
1. 
2. 
3. 

## Critérios de Sucesso
[Como medir o progresso?]
- 
- `
    }

    const template = templates[docId] || `# ${docTitle}\n\n[Adicione o conteúdo aqui]\n\nEste é um template de exemplo. Personalize conforme sua área de atuação.`
    
    // Criar blob e baixar
    const blob = new Blob([template], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `template-${docTitle.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Template baixado!')
  }

  async function handleUpdateCategory(id: string, category: string | null, priority: string | null) {
    try {
      const res = await fetch('/api/avatar-training/knowledge', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id,
          category,
          priority
        }),
      })

      if (res.ok) {
        toast.success('Categoria atualizada!')
        loadKnowledge()
        setEditingItem(null)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erro ao atualizar')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Erro ao atualizar categoria')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja deletar este conhecimento?')) {
      return
    }

    try {
      const res = await fetch(`/api/avatar-training/knowledge?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Conhecimento removido')
        loadKnowledge()
      } else {
        toast.error('Erro ao remover')
      }
    } catch (error) {
      console.error('Error deleting knowledge:', error)
      toast.error('Erro ao remover conhecimento')
    }
  }

  // Handle opening add dialog
  const openAddDialog = (categoryId?: string) => {
    setPreSelectedCategory(categoryId || null)
    setManualCategory(categoryId || '1')
    setUploadCategory(categoryId || '1')
    setIsAddDialogOpen(true)
  }

  // Handle closing add dialog
  const closeAddDialog = () => {
    setIsAddDialogOpen(false)
    setAddMode('manual')
    setManualTitle('')
    setManualContent('')
    setManualTags('')
    setManualCategory('1')
    setSelectedFiles([])
    setUploadTags('')
    setUploadCategory('1')
    setPreSelectedCategory(null)
  }

  // Handle manual text submission
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualTitle.trim() || !manualContent.trim()) {
      toast.error('Título e conteúdo são obrigatórios')
      return
    }

    setIsSubmitting(true)
    try {
      const tags = manualTags.split(',').map(t => t.trim()).filter(Boolean)
      
      const response = await fetch('/api/avatar-training/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatar_id: avatarId,
          title: manualTitle,
          content: manualContent,
          content_type: 'text',
          tags,
          metadata: {
            category: manualCategory,
            manual_entry: true
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao adicionar documento')
      }

      toast.success('Documento adicionado com sucesso!')
      closeAddDialog()
      loadKnowledge()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar documento')
      console.error('Manual add error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFiles.length === 0) {
      toast.error('Selecione pelo menos um arquivo')
      return
    }

    setIsSubmitting(true)
    const totalFiles = selectedFiles.length
    let successCount = 0
    let failCount = 0

    try {
      // Upload cada arquivo sequencialmente
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        try {
          const formData = new FormData()
          formData.append('avatar_id', avatarId)
          formData.append('file', file)
          
          const tags = uploadTags.split(',').map(t => t.trim()).filter(Boolean)
          if (tags.length > 0) {
            formData.append('tags', tags.join(','))
          }
          
          // Upload file
          const response = await fetch('/api/avatar-training/upload-document', {
            method: 'POST',
            body: formData
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Erro ao fazer upload')
          }

          const data = await response.json()
          
          // Update category after upload
          if (data.knowledge_base_id) {
            const patchResponse = await fetch('/api/avatar-training/knowledge', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: data.knowledge_base_id,
                category: uploadCategory
              })
            })
            
            if (!patchResponse.ok) {
              console.error('Failed to update category, but file was uploaded')
            }
          }

          successCount++
          console.log(`✅ Uploaded ${i + 1}/${totalFiles}: ${file.name}`)
        } catch (error: any) {
          failCount++
          console.error(`❌ Failed to upload ${file.name}:`, error)
          toast.error(`Erro ao enviar ${file.name}: ${error.message}`)
        }
      }

      // Mensagem final
      if (successCount > 0) {
        toast.success(`${successCount} arquivo(s) enviado(s) com sucesso!`)
      }
      if (failCount > 0) {
        toast.error(`${failCount} arquivo(s) falharam`)
      }

      closeAddDialog()
      loadKnowledge()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer upload')
      console.error('Upload error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // File input handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      validateAndSetFiles(Array.from(files))
    }
  }

  const validateAndSetFiles = (files: File[]) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown']
    const validExtensions = ['.pdf', '.docx', '.txt', '.md']
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    const validFiles: File[] = []
    const errors: string[] = []

    files.forEach(file => {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      
      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        errors.push(`${file.name}: formato inválido`)
        return
      }
      
      if (file.size > maxSize) {
        errors.push(`${file.name}: arquivo muito grande (máx. 10MB)`)
        return
      }

      validFiles.push(file)
    })

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles])
      toast.success(`${validFiles.length} arquivo(s) adicionado(s)`)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      validateAndSetFiles(Array.from(files))
    }
  }

  const getItemsByCategory = (categoryId: string) => {
    if (categoryId === 'nao-categorizado') {
      return knowledge.filter(item => !item.category || item.category === 'nao-categorizado')
    }
    return knowledge.filter(item => item.category === categoryId)
  }

  const getItemsByPriority = (priority: string) => {
    return knowledge.filter(item => item.priority === priority)
  }

  const getCategoryStats = (categoryId: string) => {
    const items = getItemsByCategory(categoryId).filter(item => !item.metadata?.is_template)
    const added = items.length
    const total = items.length
    return { added, total }
  }

  const getTotalStats = () => {
    const realDocs = knowledge.filter(item => !item.metadata?.is_template)
    const added = realDocs.length
    const total = realDocs.length
    return { added, total }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const stats = getTotalStats()

  return (
    <div className="space-y-6">
      {/* Header com Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Base de Conhecimento</h3>
          <p className="text-muted-foreground mt-1">
            {stats.added} documentos • {stats.added} categorizados
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-lg px-4 py-2">
            {stats.added} docs
          </Badge>
          <Button onClick={() => openAddDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Documento
          </Button>
        </div>
      </div>

      {/* Tabs: Por Categoria ou Por Prioridade */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'category' | 'priority')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="category" className="gap-2">
            <FileText className="h-4 w-4" />
            Por Categoria
          </TabsTrigger>
          <TabsTrigger value="priority" className="gap-2">
            <Clock className="h-4 w-4" />
            Por Prioridade
          </TabsTrigger>
        </TabsList>

        {/* View: Por Categoria */}
        <TabsContent value="category" className="space-y-4 mt-6">
          {CATEGORIES.map((category) => {
            const items = getItemsByCategory(category.id)
            const suggestedDocs = (SUGGESTED_DOCS[category.id as keyof typeof SUGGESTED_DOCS] || [])

            // Hide "Não Categorizado" if empty
            if (category.id === 'nao-categorizado' && items.length === 0) {
              return null
            }

            return (
              <Card key={category.id}>
                <CardContent className="p-4">
                  {/* Compact Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{category.emoji}</span>
                      <h4 className="font-semibold">{category.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {items.length} docs
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openAddDialog(category.id)}
                        className="h-7 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  </div>

                  {/* Suggested Documents - Grid of Cards */}
                  {suggestedDocs.length > 0 && (
                    <div className="mb-4 p-3 rounded-lg border border-muted/30 bg-muted/5">
                      <button
                        onClick={() => toggleSection(category.id, 'suggested')}
                        className="w-full flex items-center justify-between text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span>Documentos Sugeridos</span>
                          <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5 font-bold">
                            {suggestedDocs.filter(doc => completedSuggestions.has(doc.id)).length}/{suggestedDocs.length}
                          </Badge>
                          <div className="w-[120px] h-2 bg-muted/50 rounded-full overflow-hidden border border-muted">
                            <div 
                              className="h-full bg-green-600 transition-all duration-500"
                              style={{ width: `${(suggestedDocs.filter(doc => completedSuggestions.has(doc.id)).length / suggestedDocs.length) * 100}%` }}
                            />
                          </div>
                        </div>
                        {collapsedSections[category.id]?.suggested ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </button>
                      {!collapsedSections[category.id]?.suggested && (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                          {suggestedDocs.map((doc, idx) => {
                            // Check if this suggested doc is already added
                            const isAdded = completedSuggestions.has(doc.id)

                            return (
                              <div
                                key={idx}
                                className={`flex flex-col p-3 rounded-lg border transition-all duration-300 ${
                                  isAdded 
                                    ? 'border-green-500/50 bg-green-500/10' 
                                    : 'border-dashed bg-muted/20 hover:bg-muted/40'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h6 className={`font-semibold text-xs mb-1 line-clamp-2 leading-tight ${isAdded ? 'opacity-60' : ''}`}>
                                      {doc.title}
                                    </h6>
                                    <p className={`text-[10px] text-muted-foreground line-clamp-2 leading-snug ${isAdded ? 'opacity-60' : ''}`}>
                                      {doc.description}
                                    </p>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleMarkSuggestedAsComplete(category.id, doc.id, doc.title, doc.description, doc.priority)
                                    }}
                                    className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                                      isAdded
                                        ? 'bg-green-600 hover:bg-red-600 cursor-pointer'
                                        : 'border-2 border-muted-foreground/30 hover:bg-muted/20 hover:scale-110'
                                    }`}
                                    title={isAdded ? 'Clique para desmarcar' : 'Marcar como adicionado'}
                                  >
                                    {isAdded ? (
                                      <CheckCircle2 className="h-4 w-4 text-white" strokeWidth={3} />
                                    ) : (
                                      <Circle className="h-2.5 w-2.5 text-muted-foreground/50" />
                                    )}
                                  </button>
                                </div>
                                <div className="flex items-center justify-between mt-auto">
                                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 w-fit ${
                                    doc.priority === 'CRITICO' ? 'bg-red-500/10 text-red-600 border-red-500/30' :
                                    doc.priority === 'ESSENCIAL' ? 'bg-orange-500/10 text-orange-600 border-orange-500/30' :
                                    'bg-blue-500/10 text-blue-600 border-blue-500/30'
                                  } ${isAdded ? 'opacity-50' : ''}`}>
                                    {doc.priority === 'CRITICO' ? 'Crítico' :
                                    doc.priority === 'ESSENCIAL' ? 'Essencial' : 'Desejável'}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDownloadTemplate(doc.id, doc.title)
                                    }}
                                    className="h-5 px-2 text-[10px] gap-1 -mr-1 text-muted-foreground/60"
                                    title="Baixar template"
                                  >
                                    <Download className="h-3 w-3" />
                                    Template
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Added Documents - Compact List */}
                  {items.filter(item => !item.metadata?.is_template).length > 0 && (
                    <div className="p-3 rounded-lg border border-muted/30 bg-muted/5">
                      <button
                        onClick={() => toggleSection(category.id, 'added')}
                        className="w-full flex items-center justify-between text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                      >
                        <span>Documentos Adicionados ({items.filter(item => !item.metadata?.is_template).length})</span>
                        {collapsedSections[category.id]?.added ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </button>
                      {!collapsedSections[category.id]?.added && (
                        <div className="space-y-1.5">
                          {items.filter(item => !item.metadata?.is_template).map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start gap-2 p-2 rounded border bg-background hover:bg-muted/30 transition-colors group"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs">📄</span>
                                    <span className="font-medium text-xs truncate">
                                      {item.title}
                                    </span>
                                    {item.content_type === 'text' && (
                                      <span className="text-xs text-muted-foreground">.md</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {editingItem === item.id ? (
                                      <Select
                                        defaultValue={item.category || 'nao-categorizado'}
                                        onValueChange={(value) => {
                                          handleUpdateCategory(item.id, value, item.priority || null)
                                        }}
                                      >
                                        <SelectTrigger className="h-5 text-[10px] w-[120px]">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {CATEGORIES.filter(c => c.id !== 'nao-categorizado').map(cat => (
                                            <SelectItem key={cat.id} value={cat.id} className="text-xs">
                                              {cat.emoji} {cat.title}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => setEditingItem(item.id)}
                                          className="h-5 w-5"
                                        >
                                          <Edit2 className="h-3 w-3" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-5 w-5 text-destructive"
                                          onClick={() => handleDelete(item.id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {item.priority && (
                                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 mt-1 ${PRIORITY_CONFIG[item.priority].color}`}>
                                    {PRIORITY_CONFIG[item.priority].label}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Empty State */}
                  {items.length === 0 && suggestedDocs.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-xs">
                      Nenhum documento ainda
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        {/* View: Por Prioridade */}
        <TabsContent value="priority" className="space-y-6 mt-6">
          {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => {
            const items = getItemsByPriority(priority).filter(item => !item.metadata?.is_template)
            
            // Coletar documentos sugeridos desta prioridade
            const suggestedDocs = Object.values(SUGGESTED_DOCS)
              .flat()
              .filter(doc => doc.priority === priority)
              .map(doc => ({
                ...doc,
                title: doc.title.replace(/\[nome-avatar\]/g, avatarName)
              }))

            // Calcular estatísticas
            const totalSuggested = suggestedDocs.length
            const completedCount = suggestedDocs.filter(doc => completedSuggestions.has(doc.id)).length
            const progressPercentage = totalSuggested > 0 ? (completedCount / totalSuggested) * 100 : 0

            // Verificar se a seção está colapsada
            const isCollapsed = collapsedSections[priority]?.suggested !== false

            return (
              <Card key={priority} className="border-2">
                <CardContent className="p-6">
                  <button
                    onClick={() => toggleSection(priority, 'suggested')}
                    className="w-full flex items-center justify-between mb-4 pb-4 border-b hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={config.color + ' text-base px-3 py-1'}>
                        {config.label}
                      </Badge>
                      {totalSuggested > 0 && (
                        <>
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            {completedCount}/{totalSuggested}
                          </Badge>
                          <div className="w-[120px] h-2 bg-muted/50 rounded-full overflow-hidden border border-muted">
                            <div 
                              className="h-full bg-green-600 transition-all duration-500"
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                    {isCollapsed ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>

                  {!isCollapsed && (
                    <>
                      {/* Suggested Documents - Grid Cards */}
                      {suggestedDocs.length > 0 && (
                        <div className="p-3 rounded-lg border border-muted/30 bg-muted/5 mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {suggestedDocs.map((doc) => {
                          const isAdded = completedSuggestions.has(doc.id)
                          
                          return (
                            <div
                              key={doc.id}
                              className={`flex flex-col p-3 rounded-lg border transition-all duration-300 ${
                                isAdded 
                                  ? 'bg-green-50 dark:bg-green-950/20 border-green-500/30' 
                                  : 'bg-card border-muted/50 hover:border-muted hover:shadow-sm'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className={`font-medium text-sm mb-1 line-clamp-2 ${isAdded ? 'opacity-70' : ''}`}>
                                    {doc.title}
                                  </h4>
                                  <p className={`text-xs text-muted-foreground line-clamp-2 ${isAdded ? 'opacity-60' : ''}`}>
                                    {doc.description}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleMarkSuggestedAsComplete(priority, doc.id, doc.title, doc.description, doc.priority)
                                  }}
                                  className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                                    isAdded
                                      ? 'bg-green-600 hover:bg-red-600 cursor-pointer'
                                      : 'border-2 border-muted-foreground/30 hover:bg-muted/20 hover:scale-110'
                                  }`}
                                  title={isAdded ? 'Clique para desmarcar' : 'Marcar como adicionado'}
                                >
                                  {isAdded ? (
                                    <CheckCircle2 className="h-4 w-4 text-white" strokeWidth={3} />
                                  ) : (
                                    <Circle className="h-2.5 w-2.5 text-muted-foreground/50" />
                                  )}
                                </button>
                              </div>
                              <div className="flex items-center justify-between mt-auto">
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${
                                  doc.priority === 'CRITICO' ? 'bg-red-500/10 text-red-600 border-red-500/30' :
                                  doc.priority === 'ESSENCIAL' ? 'bg-orange-500/10 text-orange-600 border-orange-500/30' :
                                  'bg-blue-500/10 text-blue-600 border-blue-500/30'
                                } ${isAdded ? 'opacity-50' : ''}`}>
                                  {doc.priority === 'CRITICO' ? 'Crítico' :
                                  doc.priority === 'ESSENCIAL' ? 'Essencial' : 'Desejável'}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDownloadTemplate(doc.id, doc.title)
                                  }}
                                  className="h-5 px-2 text-[10px] gap-1 -mr-1 text-muted-foreground/60"
                                  title="Baixar template"
                                >
                                  <Download className="h-3 w-3" />
                                  Template
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actual Documents - Compact List */}
                  {items.length > 0 && (
                    <div className="p-3 rounded-lg border border-muted/30 bg-muted/5">
                      <h5 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                        Documentos Adicionados ({items.length})
                      </h5>
                      <div className="space-y-1.5">
                        {items.map((item) => {
                          const category = CATEGORIES.find(c => c.id === item.category)

                          return (
                            <div
                              key={item.id}
                              className="flex items-start gap-2 p-2 rounded border bg-background hover:bg-muted/30 transition-colors group"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs">📄</span>
                                    <span className="font-medium text-xs truncate">
                                      {item.title}
                                    </span>
                                    {item.content_type === 'text' && (
                                      <span className="text-xs text-muted-foreground">.md</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                                      {category?.emoji} {category?.title || 'Sem categoria'}
                                    </Badge>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6 text-destructive"
                                      onClick={() => handleDelete(item.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {items.length === 0 && suggestedDocs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Nenhum documento com esta prioridade
                    </div>
                  )}
                </>
              )}
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>
      </Tabs>

      {/* Add Document Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Documento</DialogTitle>
            <DialogDescription>
              Adicione conhecimento manualmente ou faça upload de um arquivo
            </DialogDescription>
          </DialogHeader>

          {/* Mode Selector */}
          <Tabs value={addMode} onValueChange={(v) => setAddMode(v as 'manual' | 'upload')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual" className="gap-2">
                <FileText className="h-4 w-4" />
                Adicionar Texto
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload de Arquivo
              </TabsTrigger>
            </TabsList>

            {/* Manual Text Form */}
            <TabsContent value="manual" className="space-y-4 mt-4">
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-title">Título *</Label>
                  <Input
                    id="manual-title"
                    placeholder="Ex: Biografia do Mestre Ye"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-content">Conteúdo *</Label>
                  <Textarea
                    id="manual-content"
                    placeholder="Cole o conteúdo do documento aqui..."
                    value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    rows={12}
                    required
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {manualContent.length} caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-category">Categoria</Label>
                  <Select value={manualCategory} onValueChange={setManualCategory}>
                    <SelectTrigger id="manual-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter(c => c.id !== 'nao-categorizado').map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.emoji} {cat.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-tags">Tags (separadas por vírgula)</Label>
                  <Input
                    id="manual-tags"
                    placeholder="Ex: biografia, filosofia, historia"
                    value={manualTags}
                    onChange={(e) => setManualTags(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Opcional. Use tags para facilitar a busca.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={closeAddDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Adicionando...' : 'Adicionar Documento'}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Upload File Form */}
            <TabsContent value="upload" className="space-y-4 mt-4">
              <form onSubmit={handleFileUpload} className="space-y-4">
                {/* File Drop Zone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {selectedFiles.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-left space-y-2">
                        <p className="font-medium text-sm text-center mb-3">
                          {selectedFiles.length} arquivo(s) selecionado(s)
                        </p>
                        <div className="max-h-48 overflow-y-auto space-y-2">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded border">
                              <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(file.size / 1024).toFixed(2)} KB
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 flex-shrink-0"
                                onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Adicionar mais arquivos
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="font-medium mb-1">
                          Arraste arquivos ou clique para selecionar
                        </p>
                        <p className="text-sm text-muted-foreground">
                          PDF, DOCX, TXT ou MD • Máximo 10MB por arquivo
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Selecionar Arquivos
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.txt,.md"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upload-category">Categoria</Label>
                  <Select value={uploadCategory} onValueChange={setUploadCategory}>
                    <SelectTrigger id="upload-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter(c => c.id !== 'nao-categorizado').map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.emoji} {cat.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upload-tags">Tags (separadas por vírgula)</Label>
                  <Input
                    id="upload-tags"
                    placeholder="Ex: medicina, cinco-elementos, pratica"
                    value={uploadTags}
                    onChange={(e) => setUploadTags(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={closeAddDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting || selectedFiles.length === 0}>
                    {isSubmitting ? 'Enviando...' : `Fazer Upload${selectedFiles.length > 0 ? ` (${selectedFiles.length})` : ''}`}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
