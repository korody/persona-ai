'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function QuizBanner() {
  const [hasQuiz, setHasQuiz] = useState<boolean | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    async function checkQuiz() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          setHasQuiz(null)
          return
        }

        // Buscar quiz do usuário
        const { data: quizData } = await supabase
          .from('quiz_leads')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle()

        setHasQuiz(!!quizData)
      } catch (error) {
        console.error('Erro ao verificar quiz:', error)
        setHasQuiz(null)
      }
    }

    checkQuiz()
  }, [])

  // Auto-hide após 30 segundos
  useEffect(() => {
    if (hasQuiz === false && !isDismissed) {
      const timer = setTimeout(() => {
        setIsDismissed(true)
      }, 30000) // 30 segundos

      return () => clearTimeout(timer)
    }
  }, [hasQuiz, isDismissed])

  // Não mostrar se tem quiz ou se foi dispensado
  if (hasQuiz || hasQuiz === null || isDismissed) {
    return null
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950 border-l-4 border-amber-500 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
            ⚠️ Anamnese pendente!
          </h3>
          <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
            Faça sua Anamnese Express dos 5 Elementos da Medicina Tradicional Chinesa para ter respostas personalizadas, baseadas no seu elemento principal e diagnóstico individual.
          </p>
          <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
            <Link href="/quiz">
              Fazer Avaliação →
            </Link>
          </Button>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 shrink-0"
          aria-label="Dispensar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
