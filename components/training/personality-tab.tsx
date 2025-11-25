'use client'

/**
 * Aba de Personalidade
 * Ajustar prompt, tom, formatura, estilo de resposta
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Lightbulb, Save, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface PersonalityTabProps {
  avatar: any
}

export function PersonalityTab({ avatar }: PersonalityTabProps) {
  const [systemPrompt, setSystemPrompt] = useState(avatar.system_prompt || '')
  const [temperature, setTemperature] = useState(avatar.temperature || 0.7)
  const [maxTokens, setMaxTokens] = useState(avatar.max_tokens || 500)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handlePromptChange = (value: string) => {
    setSystemPrompt(value)
    setHasChanges(true)
  }

  const handleTemperatureChange = (value: number[]) => {
    setTemperature(value[0])
    setHasChanges(true)
  }

  const handleMaxTokensChange = (value: number[]) => {
    setMaxTokens(value[0])
    setHasChanges(true)
  }

  const handleReset = () => {
    setSystemPrompt(avatar.system_prompt || '')
    setTemperature(avatar.temperature || 0.7)
    setMaxTokens(avatar.max_tokens || 500)
    setHasChanges(false)
    toast.info('Alterações descartadas')
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      console.log('💾 Salvando personalidade via API route...')
      
      const response = await fetch('/api/avatar-training/personality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          avatar_id: avatar.id,
          system_prompt: systemPrompt,
          temperature,
          max_tokens: maxTokens
        })
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Erro ao salvar')
      }

      console.log('✅ Resultado:', result)
      setHasChanges(false)
      toast.success('Personalidade atualizada com sucesso!')
      
      setTimeout(() => window.location.reload(), 500)
    } catch (error) {
      console.error('Erro ao salvar:', error)
      const message = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(`Erro ao salvar: ${message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Lightbulb className="w-4 h-4" />
        <AlertDescription>
          Defina como seu avatar deve se comunicar e responder aos usuários.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Instruções de Comportamento</CardTitle>
          <CardDescription>
            Como o avatar deve se apresentar e agir nas conversas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Textarea
              value={systemPrompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              placeholder="Digite o prompt do sistema..."
              className="min-h-[450px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {systemPrompt.length} caracteres
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estilo de Resposta</CardTitle>
          <CardDescription>
            Controle como o avatar se expressa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Criatividade</Label>
              <span className="text-sm text-muted-foreground font-mono">
                {temperature.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[temperature]}
              onValueChange={handleTemperatureChange}
              min={0}
              max={2}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Mais previsível e direto</span>
              <span>Mais criativo e variado</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Tamanho da Resposta</Label>
              <span className="text-sm text-muted-foreground">
                ~{Math.round(maxTokens * 0.75)} palavras
              </span>
            </div>
            <Slider
              value={[maxTokens]}
              onValueChange={handleMaxTokensChange}
              min={100}
              max={4000}
              step={100}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Respostas curtas</span>
              <span>Respostas longas e detalhadas</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões de ação */}
      {hasChanges && (
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isSaving}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Descartar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      )}
    </div>
  )
}
