'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Search, 
  Filter,
  CheckCircle2,
  XCircle,
  FileEdit,
  ExternalLink,
  Sparkles,
  RefreshCw
} from 'lucide-react'
import { ExerciseEditDialog } from './exercise-edit-dialog'
import { Switch } from '@/components/ui/switch'
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
  enabled: boolean
}

export function ExerciseBrowser() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeFilter, setActiveFilter] = useState<string>('active') // Novo filtro: padrão "active"
  const [courses, setCourses] = useState<string[]>([])
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  // Format course slug to readable name
  const formatCourseName = (slug: string | null): string => {
    if (!slug) return '—'
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  useEffect(() => {
    loadExercises()
  }, [])

  const loadExercises = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/memberkit/exercises')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log('Exercises loaded:', data)
      setExercises(data.exercises || [])
      
      // Extract unique courses
      const uniqueCourses = [...new Set(
        (data.exercises || [])
          .map((e: Exercise) => e.memberkit_course_slug)
          .filter(Boolean)
      )]
      setCourses(uniqueCourses as string[])
    } catch (error) {
      console.error('Error loading exercises:', error)
      setExercises([])
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const toggleExercise = async (lessonId: string, enabled: boolean) => {
    const previousExercises = [...exercises]
    
    // Optimistic update
    setExercises(exercises.map(ex => 
      ex.lesson_id === lessonId ? { ...ex, enabled } : ex
    ))

    try {
      const response = await fetch('/api/admin/memberkit/exercises/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, enabled })
      })

      if (!response.ok) {
        throw new Error('Failed to toggle exercise')
      }

      toast.success(
        enabled ? '✅ Exercício ativado' : '🚫 Exercício desativado',
        { duration: 2000 }
      )
    } catch (error) {
      // Rollback on error
      setExercises(previousExercises)
      toast.error('Erro ao atualizar exercício')
    }
  }

  const filteredExercises = (exercises || []).filter(exercise => {
    // Active/Inactive filter (PRIMEIRO FILTRO - mais importante)
    if (activeFilter === 'active' && !exercise.enabled) {
      return false
    }
    if (activeFilter === 'inactive' && exercise.enabled) {
      return false
    }

    // Search filter
    if (searchTerm && !exercise.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Course filter
    if (courseFilter !== 'all' && exercise.memberkit_course_slug !== courseFilter) {
      return false
    }

    // Status filter
    if (statusFilter === 'curated' && !exercise.has_metadata) {
      return false
    }
    if (statusFilter === 'uncurated' && exercise.has_metadata) {
      return false
    }
    if (statusFilter === 'with-embedding' && !exercise.has_embedding) {
      return false
    }
    if (statusFilter === 'without-embedding' && exercise.has_embedding) {
      return false
    }

    return true
  })

  // Pagination
  const totalPages = Math.ceil(filteredExercises.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedExercises = filteredExercises.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, courseFilter, statusFilter, activeFilter])

  const getElementBadgeColor = (element: string | null) => {
    if (!element) return 'secondary'
    const colors: Record<string, string> = {
      TERRA: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      ÁGUA: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      FOGO: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      METAL: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      MADEIRA: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    }
    return colors[element] || 'secondary'
  }

  const getLevelBadgeColor = (level: string | null) => {
    if (!level) return 'secondary'
    const colors: Record<string, string> = {
      INICIANTE: 'bg-green-100 text-green-800',
      INTERMEDIÁRIO: 'bg-orange-100 text-orange-800',
      AVANÇADO: 'bg-red-100 text-red-800'
    }
    return colors[level] || 'secondary'
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome do exercício..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="active">Status</Label>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger id="active">
                  <SelectValue placeholder="Ativos" />
                </SelectTrigger>
                <SelectContent side="bottom" align="start">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">✅ Ativos</SelectItem>
                  <SelectItem value="inactive">🚫 Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="course">Curso</Label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger id="course">
                  <SelectValue placeholder="Todos os cursos" />
                </SelectTrigger>
                <SelectContent side="bottom" align="start" className="max-h-[300px]">
                  <SelectItem value="all">Todos os cursos</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course} value={course}>
                      {formatCourseName(course)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Categorização</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent side="bottom" align="start">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="categorized">Categorizados</SelectItem>
                  <SelectItem value="uncategorized">Não categorizados</SelectItem>
                  <SelectItem value="with-embedding">Semantizado</SelectItem>
                  <SelectItem value="without-embedding">Não semantizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Mostrando {startIndex + 1}-{Math.min(endIndex, filteredExercises.length)} de {filteredExercises.length} exercícios
              {filteredExercises.length !== exercises.length && ` (filtrados de ${exercises.length} totais)`}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Exercise Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Exercícios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Status</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Elemento</TableHead>
                  <TableHead>Categorização</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredExercises.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum exercício encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedExercises.map(exercise => (
                    <TableRow key={exercise.lesson_id}>
                      <TableCell>
                        <Switch
                          checked={exercise.enabled}
                          onCheckedChange={(checked) => toggleExercise(exercise.lesson_id, checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate">
                        {exercise.title}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground truncate block max-w-[200px]">
                          {formatCourseName(exercise.memberkit_course_slug)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {exercise.duration_minutes ? `${exercise.duration_minutes}min` : '—'}
                      </TableCell>
                      <TableCell>
                        {exercise.level ? (
                          <Badge className={getLevelBadgeColor(exercise.level)} variant="secondary">
                            {exercise.level}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {exercise.element ? (
                          <Badge className={getElementBadgeColor(exercise.element)} variant="secondary">
                            {exercise.element}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {exercise.has_metadata ? (
                          <Badge variant="default">
                            Categorizado
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Não categorizado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                            onClick={() => {
                              setEditingExercise(exercise)
                              setDialogOpen(true)
                            }}
                          >
                            <FileEdit className="h-3 w-3" />
                            Editar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  Primeira
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Última
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ExerciseEditDialog
        exercise={editingExercise}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={loadExercises}
      />
    </div>
  )
}
