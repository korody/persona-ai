'use client'

/**
 * Badge que mostra status do quiz do usuário
 * COM QUIZ: Mostra elemento principal
 * SEM QUIZ: Convite para fazer avaliação
 */

import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Lightbulb } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface QuizLead {
  nome: string
  elemento_principal: string
  nome_perfil: string
}

export function QuizStatusBadge() {
  const [quizData, setQuizData] = useState<QuizLead | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadQuizStatus() {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('quiz_leads')
        .select('nome, elemento_principal, nome_perfil')
        .eq('email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setQuizData(data)
      setLoading(false)
    }

    loadQuizStatus()
  }, [])

  if (loading) return null

  // COM QUIZ
  if (quizData) {
    const elementEmojis: Record<string, string> = {
      'MADEIRA': '🌳',
      'FOGO': '🔥',
      'TERRA': '🏔️',
      'METAL': '⚙️',
      'ÁGUA': '🌊'
    }

    const emoji = elementEmojis[quizData.elemento_principal] || '✨'

    return (
      <Alert className="border-green-500/50 bg-green-500/10">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertDescription className="flex items-center gap-2">
          <span className="font-semibold">Avaliação Completa</span>
          <span className="text-muted-foreground">•</span>
          <span>
            {emoji} Elemento Principal: <strong>{quizData.elemento_principal}</strong>
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">
            Respostas personalizadas ativas
          </span>
        </AlertDescription>
      </Alert>
    )
  }

  // SEM QUIZ
  return (
    <Alert className="border-blue-500/50 bg-blue-500/10">
      <Lightbulb className="h-4 w-4 text-blue-500" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="font-semibold mb-1">Avaliação dos 5 Elementos</p>
          <p className="text-sm text-muted-foreground">
            Faça a avaliação para respostas personalizadas baseadas no seu elemento principal
          </p>
        </div>
        <Link href="/quiz">
          <Button size="sm" variant="outline">
            Fazer Avaliação →
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  )
}
