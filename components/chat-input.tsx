// components/chat-input.tsx

'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Send, Loader2 } from 'lucide-react'
import { useCredits } from '@/hooks/use-credits'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
  disabled?: boolean
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { credits, isOutOfCredits } = useCredits()

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || disabled || isOutOfCredits) return

    onSend(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t bg-background p-4">
      <div className="mx-auto max-w-4xl">
        {isOutOfCredits && (
          <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            ⚠️ Você não tem créditos suficientes.{' '}
            <a href="/pricing" className="underline font-semibold">
              Assine um plano
            </a>{' '}
            para continuar conversando.
          </div>
        )}

        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isOutOfCredits
                ? 'Sem créditos disponíveis...'
                : 'Digite sua mensagem... (Shift + Enter para nova linha)'
            }
            disabled={isLoading || disabled || isOutOfCredits}
            className="min-h-[60px] max-h-[200px] resize-none"
            rows={1}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading || disabled || isOutOfCredits}
            className="h-[60px] w-[60px] shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="mt-2 text-xs text-muted-foreground text-center">
          {credits && (
            <span>
              {credits.total} {credits.total === 1 ? 'crédito disponível' : 'créditos disponíveis'} • 1 crédito por interação
            </span>
          )}
        </div>
      </div>
    </form>
  )
}
