'use client'

/**
 * Badge que mostra status do quiz do usuário
 * COM QUIZ: Mostra elemento principal
 * SEM QUIZ: Convite para fazer avaliação
 */

import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Lightbulb, FileText, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface QuizLead {
  nome: string
  elemento_principal: string
  nome_perfil: string
}

interface QuizStatusBadgeProps {
  onSendDiagnosis?: (diagnosis: string) => void
}

export function QuizStatusBadge({ onSendDiagnosis }: QuizStatusBadgeProps = {}) {
  const [quizData, setQuizData] = useState<QuizLead | null>(null)
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(true)
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false)

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

  // Auto-hide após 30 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
    }, 30000) // 30 segundos

    return () => clearTimeout(timer)
  }, [])

  const handleReceiveDiagnosis = async () => {
    if (!onSendDiagnosis) return
    
    try {
      setLoadingDiagnosis(true)
      // Enviar mensagem artificial do usuário pedindo o diagnóstico
      await onSendDiagnosis('Mestre Ye, por favor me envie o diagnóstico completo da minha Anamnese dos 5 Elementos.')
      setLoadingDiagnosis(false)
    } catch (error) {
      console.error('Erro ao solicitar diagnóstico:', error)
      setLoadingDiagnosis(false)
      alert('Erro ao solicitar diagnóstico. Tente novamente.')
    }
  }

  if (loading || !visible) return null

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
        <AlertDescription className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <span className="font-semibold">Anamnese Completa</span>
            <span className="text-muted-foreground">•</span>
            <span>
              {emoji} Elemento Principal: <strong>{quizData.elemento_principal}</strong>
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              Respostas personalizadas ativas
            </span>
          </div>
          {onSendDiagnosis && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleReceiveDiagnosis}
              disabled={loadingDiagnosis}
              className="shrink-0"
            >
              {loadingDiagnosis ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Receber Diagnóstico
                </>
              )}
            </Button>
          )}
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
          <p className="font-semibold mb-1">⚠️ Anamnese pendente!</p>
          <p className="text-sm text-muted-foreground">
            Faça sua Anamnese Express dos 5 Elementos da Medicina Tradicional Chinesa para ter respostas personalizadas, baseadas no seu elemento principal e diagnóstico individual.
          </p>
        </div>
        <Link href="https://quiz.qigongbrasil.com/" target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="outline">
            Fazer Avaliação →
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  )
}
