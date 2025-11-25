'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface Exercise {
  lesson_id: string
  title: string
  memberkit_course_slug: string | null
  has_metadata: boolean
  has_embedding: boolean
  duration_minutes: number | null
  level: string | null
  element: string | null
}

interface Props {
  exercise: Exercise | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function ExerciseEditDialog({ exercise, open, onOpenChange, onSave }: Props) {
  const [formData, setFormData] = useState({
    duration_minutes: exercise?.duration_minutes?.toString() || '',
    level: exercise?.level || '',
    element: exercise?.element || '',
    organs: '',
    benefits: '',
    indications: '',
    contraindications: ''
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!exercise) return

    setSaving(true)
    try {
      const response = await fetch('/api/admin/memberkit/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: exercise.lesson_id,
          duration_minutes: parseInt(formData.duration_minutes) || null,
          level: formData.level || null,
          element: formData.element || null,
          organs: formData.organs || null,
          benefits: formData.benefits || null,
          indications: formData.indications || null,
          contraindications: formData.contraindications || null
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Metadados salvos! Embedding gerado automaticamente ✨')
        onSave()
        onOpenChange(false)
      } else {
        toast.error('Erro ao salvar metadados')
      }
    } catch (error) {
      toast.error('Erro ao salvar metadados')
    } finally {
      setSaving(false)
    }
  }

  if (!exercise) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Categorizar Exercício</DialogTitle>
          <DialogDescription>
            {exercise.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
              />
            </div>

            {/* Level */}
            <div className="space-y-2">
              <Label htmlFor="level">Nível</Label>
              <Select value={formData.level} onValueChange={(v) => setFormData({ ...formData, level: v })}>
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
              <Select value={formData.element} onValueChange={(v) => setFormData({ ...formData, element: v })}>
                <SelectTrigger id="element">
                  <SelectValue placeholder="Selecione o elemento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TERRA">🟡 Terra</SelectItem>
                  <SelectItem value="ÁGUA">🔵 Água</SelectItem>
                  <SelectItem value="FOGO">🔴 Fogo</SelectItem>
                  <SelectItem value="METAL">⚪ Metal</SelectItem>
                  <SelectItem value="MADEIRA">🟢 Madeira</SelectItem>
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
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={saving} className="gap-2 flex-1">
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar Metadados'}
            </Button>
            <Button onClick={() => onOpenChange(false)} variant="outline" className="gap-2">
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
