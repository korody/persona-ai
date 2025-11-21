'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileEdit, Save, X, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export function MetadataEditor() {
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [formData, setFormData] = useState({
    duration_minutes: '',
    level: '',
    element: '',
    organs: '',
    benefits: '',
    indications: '',
    contraindications: ''
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!selectedExercise) {
      toast.error('Selecione um exercício primeiro')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/memberkit/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: selectedExercise,
          ...formData
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Metadados salvos com sucesso!')
      } else {
        toast.error('Erro ao salvar metadados')
      }
    } catch (error) {
      toast.error('Erro ao salvar metadados')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setFormData({
      duration_minutes: '',
      level: '',
      element: '',
      organs: '',
      benefits: '',
      indications: '',
      contraindications: ''
    })
  }

  return (
    <div className="space-y-6">
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-900">
        <CardHeader>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <CardTitle className="text-sm text-orange-900 dark:text-orange-100">
                Editor de Metadados
              </CardTitle>
              <CardDescription className="text-orange-700 dark:text-orange-300">
                Esta funcionalidade ainda está em desenvolvimento. Por enquanto, edite o arquivo{' '}
                <code className="bg-orange-100 dark:bg-orange-900 px-1 rounded">
                  exercicios-metadata.json
                </code>
                {' '}diretamente e execute{' '}
                <code className="bg-orange-100 dark:bg-orange-900 px-1 rounded">
                  pnpm sync-memberkit
                </code>
                {' '}para sincronizar.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileEdit className="h-4 w-4" />
            Formulário de Metadados
          </CardTitle>
          <CardDescription>
            Preencha as informações do exercício para enriquecer a base de conhecimento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Exercise Selector */}
          <div className="space-y-2">
            <Label htmlFor="exercise">Exercício</Label>
            <Select value={selectedExercise} onValueChange={setSelectedExercise} disabled>
              <SelectTrigger id="exercise">
                <SelectValue placeholder="Selecione um exercício" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="placeholder">Em breve...</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duração (minutos)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="Ex: 30"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                disabled
              />
            </div>

            {/* Level */}
            <div className="space-y-2">
              <Label htmlFor="level">Nível</Label>
              <Select value={formData.level} onValueChange={(v) => setFormData({ ...formData, level: v })} disabled>
                <SelectTrigger id="level">
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INICIANTE">Iniciante</SelectItem>
                  <SelectItem value="INTERMEDIÁRIO">Intermediário</SelectItem>
                  <SelectItem value="AVANÇADO">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Element */}
            <div className="space-y-2">
              <Label htmlFor="element">Elemento</Label>
              <Select value={formData.element} onValueChange={(v) => setFormData({ ...formData, element: v })} disabled>
                <SelectTrigger id="element">
                  <SelectValue placeholder="Selecione o elemento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TERRA">Terra</SelectItem>
                  <SelectItem value="ÁGUA">Água</SelectItem>
                  <SelectItem value="FOGO">Fogo</SelectItem>
                  <SelectItem value="METAL">Metal</SelectItem>
                  <SelectItem value="MADEIRA">Madeira</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Organs */}
            <div className="space-y-2">
              <Label htmlFor="organs">Órgãos Beneficiados</Label>
              <Input
                id="organs"
                placeholder="Ex: Baço, Estômago, Pâncreas"
                value={formData.organs}
                onChange={(e) => setFormData({ ...formData, organs: e.target.value })}
                disabled
              />
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <Label htmlFor="benefits">Benefícios</Label>
            <Textarea
              id="benefits"
              placeholder="Descreva os principais benefícios do exercício..."
              rows={3}
              value={formData.benefits}
              onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
              disabled
            />
          </div>

          {/* Indications */}
          <div className="space-y-2">
            <Label htmlFor="indications">Indicações</Label>
            <Textarea
              id="indications"
              placeholder="Para quais condições este exercício é indicado..."
              rows={3}
              value={formData.indications}
              onChange={(e) => setFormData({ ...formData, indications: e.target.value })}
              disabled
            />
          </div>

          {/* Contraindications */}
          <div className="space-y-2">
            <Label htmlFor="contraindications">Contraindicações</Label>
            <Textarea
              id="contraindications"
              placeholder="Situações em que este exercício não deve ser praticado..."
              rows={3}
              value={formData.contraindications}
              onChange={(e) => setFormData({ ...formData, contraindications: e.target.value })}
              disabled
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving || !selectedExercise} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar Metadados'}
            </Button>
            <Button onClick={handleReset} variant="outline" disabled={!selectedExercise} className="gap-2">
              <X className="h-4 w-4" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Guia Rápido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <strong className="text-foreground">Elementos:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li><strong>TERRA</strong>: Estabilidade, digestão, centramento (Baço, Estômago, Pâncreas)</li>
              <li><strong>ÁGUA</strong>: Vitalidade, longevidade, rins (Rins, Bexiga, Sistema Reprodutor)</li>
              <li><strong>FOGO</strong>: Circulação, alegria, coração (Coração, Intestino Delgado)</li>
              <li><strong>METAL</strong>: Respiração, imunidade, pulmões (Pulmões, Intestino Grosso)</li>
              <li><strong>MADEIRA</strong>: Movimento, flexibilidade, fígado (Fígado, Vesícula Biliar)</li>
            </ul>
          </div>

          <div>
            <strong className="text-foreground">Níveis:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li><strong>INICIANTE</strong>: Movimentos básicos, introdutórios</li>
              <li><strong>INTERMEDIÁRIO</strong>: Requer prática prévia</li>
              <li><strong>AVANÇADO</strong>: Movimentos complexos, exigem domínio</li>
            </ul>
          </div>

          <div className="pt-3 border-t">
            <p className="text-xs">
              💡 <strong>Dica:</strong> Use a busca semântica para encontrar exercícios similares e garantir consistência nos metadados.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
