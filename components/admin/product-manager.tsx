'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Plus, Trash2, Edit2, Save, X, Upload, FileUp, Download, Link2, Info } from 'lucide-react'
import type { AvatarProduct } from '@/types/marketing'

export function ProductManager({ avatarSlug }: { avatarSlug: string }) {
  const [products, setProducts] = useState<AvatarProduct[]>([])
  const [memberkitProducts, setMemberkitProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [integrating, setIntegrating] = useState(false)
  const [integrationResult, setIntegrationResult] = useState<any>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    product_name: '',
    product_type: '',
    product_description: '',
    product_price_brl: '',
    product_url: '',
    memberkit_url: '',
    memberkit_course_id: '',
    tags: '',
    element: '',
    recommended_for: '',
    benefits: '',
    is_featured: false
  })

  const supabase = createClient()

  useEffect(() => {
    loadProducts()
    loadMemberkitProducts()
  }, [avatarSlug])

  async function loadProducts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('avatar_portfolio')
      .select('*')
      .eq('avatar_slug', avatarSlug)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })

    if (!error && data) {
      setProducts(data)
    }
    setLoading(false)
  }

  async function loadMemberkitProducts() {
    // Buscar todos os cursos da tabela hub_courses
    const { data, error } = await supabase
      .from('hub_courses')
      .select('memberkit_course_id, memberkit_course_slug, course_name, course_url, is_published')
      .order('course_name')

    if (!error && data) {
      // Mapear cursos para o formato esperado
      const courses = data.map((course: any) => ({
        id: course.memberkit_course_id,
        product_id: course.memberkit_course_id.toString(),
        name: course.course_name,
        url: course.course_url,
        is_active: course.is_published
      }))
      
      setMemberkitProducts(courses)
    }
  }

  function handleMemberkitProductSelect(productId: string) {
    const selected = memberkitProducts.find(p => p.product_id === productId)
    if (selected) {
      setFormData({
        ...formData,
        memberkit_url: selected.url || '',
        memberkit_course_id: selected.product_id || ''
      })
    }
  }

  async function handleSave() {
    console.log('💾 Salvando produto...', formData)
    
    const dataToSave = {
      ...formData,
      avatar_slug: avatarSlug,
      product_price_brl: formData.product_price_brl ? parseFloat(formData.product_price_brl) : null,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : null,
      element: formData.element || null
    }

    console.log('📦 Data to save:', dataToSave)

    if (editing) {
      const { data, error } = await supabase
        .from('avatar_portfolio')
        .update(dataToSave)
        .eq('id', editing)
        .select()

      console.log('✏️ Update result:', { data, error })

      if (error) {
        console.error('❌ Error updating:', error)
        alert(`Erro ao atualizar: ${error.message}`)
      } else {
        console.log('✅ Updated successfully')
        setEditing(null)
        resetForm()
        loadProducts()
      }
    } else {
      const { data, error } = await supabase
        .from('avatar_portfolio')
        .insert([dataToSave])
        .select()

      console.log('➕ Insert result:', { data, error })

      if (error) {
        console.error('❌ Error inserting:', error)
        alert(`Erro ao criar: ${error.message}`)
      } else {
        console.log('✅ Inserted successfully')
        setCreating(false)
        resetForm()
        loadProducts()
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return

    const { error } = await supabase
      .from('avatar_portfolio')
      .delete()
      .eq('id', id)

    if (!error) {
      loadProducts()
    }
  }

  async function toggleAvailable(product: AvatarProduct) {
    const { error } = await supabase
      .from('avatar_portfolio')
      .update({ is_available: !product.is_available })
      .eq('id', product.id)

    if (!error) {
      loadProducts()
    }
  }

  function startEdit(product: AvatarProduct) {
    setEditing(product.id)
    setCreating(false)
    setFormData({
      product_name: product.product_name,
      product_type: product.product_type || '',
      product_description: product.product_description || '',
      product_price_brl: product.product_price_brl?.toString() || '',
      product_url: product.product_url || '',
      memberkit_url: product.memberkit_url || '',
      memberkit_course_id: product.memberkit_course_id?.toString() || '',
      tags: product.tags?.join(', ') || '',
      element: product.element || '',
      recommended_for: product.recommended_for || '',
      benefits: product.benefits || '',
      is_featured: product.is_featured
    })
    
    // Scroll para o formulário após um pequeno delay
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  function resetForm() {
    setFormData({
      product_name: '',
      product_type: '',
      product_description: '',
      product_price_brl: '',
      product_url: '',
      memberkit_url: '',
      memberkit_course_id: '',
      tags: '',
      element: '',
      recommended_for: '',
      benefits: '',
      is_featured: false
    })
  }

  function cancelEdit() {
    setEditing(null)
    setCreating(false)
    resetForm()
  }

  async function handleIntegration() {
    if (!confirm('Deseja integrar automaticamente os produtos com os cursos do Memberkit?\n\nIsso irá atualizar os campos memberkit_url e memberkit_course_id baseado na similaridade dos nomes.')) {
      return
    }

    setIntegrating(true)
    setIntegrationResult(null)

    try {
      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('Você precisa estar autenticado')
        return
      }

      const response = await fetch('/api/admin/marketing/integrate-products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          avatarSlug,
          minSimilarity: 0.6 // 60% de similaridade mínima
        })
      })

      const result = await response.json()

      if (response.ok) {
        setIntegrationResult(result)
        loadProducts() // Recarregar produtos atualizados
        alert(`✅ Integração concluída!\n\n✅ ${result.matched} produtos vinculados\n❌ ${result.notMatched} sem match aceitável`)
      } else {
        alert(`Erro na integração: ${result.message || result.error}`)
      }
    } catch (error) {
      console.error('Integration error:', error)
      alert('Erro ao integrar produtos')
    } finally {
      setIntegrating(false)
    }
  }

  async function handleScrapeUrl(url: string) {
    if (!url) return

    setLoading(true)
    try {
      const response = await fetch('/api/scrape-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })

      const result = await response.json()

      if (result.success && result.data) {
        setFormData({
          ...formData,
          product_name: result.data.product_name || formData.product_name,
          product_description: result.data.product_description || formData.product_description,
          product_price_brl: result.data.product_price_brl?.toString() || formData.product_price_brl,
          product_type: result.data.product_type || formData.product_type,
          product_url: result.data.product_url || formData.product_url
        })
      } else {
        alert('Não foi possível extrair informações desta URL')
      }
    } catch (error) {
      console.error('Scraping error:', error)
      alert('Erro ao buscar informações da URL')
    } finally {
      setLoading(false)
    }
  }

  async function handleImportCSV(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('avatarSlug', avatarSlug)

      const response = await fetch('/api/import-products', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        alert(`✅ ${result.imported} produtos importados com sucesso!`)
        loadProducts()
      } else {
        alert(`❌ Erro ao importar: ${result.error}`)
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('❌ Erro ao importar arquivo CSV')
    } finally {
      setImporting(false)
      // Limpar input
      event.target.value = ''
    }
  }

  function downloadTemplate() {
    const template = `Nome do Produto,Acesso,CAMPANHAS,Categoria,Descrição,Pra que Serve,Sigla,Status,Tipo,Valor Prateleira,Valor Praticado
Curso Exemplo,1 Ano,,Front End,Descrição do curso exemplo,Para aprender técnicas incríveis,CEX,Ativo,Curso Gravado,R$997.00,R$497.00`
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'template-produtos.csv'
    link.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Produtos e Serviços</h2>
          <p className="text-sm text-muted-foreground">
            Configure produtos que a IA pode recomendar nas conversas
          </p>
        </div>
        {!creating && !editing && (
          <div className="flex gap-2">
            <Button
              onClick={handleIntegration}
              disabled={integrating}
              variant="outline"
              className="gap-2"
            >
              {integrating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Integrando...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Integrar com Cursos
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(true)}
              disabled={importing}
            >
              {importing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileUp className="mr-2 h-4 w-4" />
              )}
              Importar CSV
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </div>
        )}
      </div>

      {/* Integration Result */}
      {integrationResult && (
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Resultado da Integração
            </CardTitle>
            <CardDescription>
              Produtos vinculados automaticamente aos cursos do Memberkit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-100 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Vinculados</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                  {integrationResult.matched}
                </p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Sem Match</p>
                <p className="text-3xl font-bold text-orange-700 dark:text-orange-400">
                  {integrationResult.notMatched}
                </p>
              </div>
            </div>
            
            {integrationResult.details && integrationResult.details.length > 0 && (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                <h4 className="font-semibold text-sm">Detalhes:</h4>
                {integrationResult.details.map((detail: any, idx: number) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded-lg text-sm ${
                      detail.updated 
                        ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800' 
                        : 'bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium">{detail.productName}</p>
                        {detail.courseName && (
                          <p className="text-xs text-muted-foreground mt-1">
                            → {detail.courseName} ({Math.round(detail.similarity * 100)}% match)
                          </p>
                        )}
                      </div>
                      {detail.updated ? (
                        <Badge variant="default" className="shrink-0">✓ Vinculado</Badge>
                      ) : (
                        <Badge variant="secondary" className="shrink-0">
                          {detail.similarity > 0 ? `${Math.round(detail.similarity * 100)}%` : 'Sem match'}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIntegrationResult(null)}
              className="w-full"
            >
              Fechar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Import CSV Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Importar Produtos via CSV
            </DialogTitle>
            <DialogDescription>
              Importe múltiplos produtos de uma vez usando um arquivo CSV
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">📋 Formato do CSV:</h4>
              <p className="text-sm text-muted-foreground mb-3">
                O arquivo CSV deve conter as seguintes colunas (na ordem):
              </p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• <strong>Nome do Produto</strong> - Nome do produto ou serviço</li>
                <li>• <strong>Acesso</strong> - Período de acesso (ex: 1 Ano)</li>
                <li>• <strong>CAMPANHAS</strong> - Tags de campanha (opcional)</li>
                <li>• <strong>Categoria</strong> - Categoria do produto</li>
                <li>• <strong>Descrição</strong> - Descrição detalhada</li>
                <li>• <strong>Pra que Serve</strong> - Benefícios e utilidade</li>
                <li>• <strong>Sigla</strong> - Sigla identificadora</li>
                <li>• <strong>Status</strong> - Ativo ou Inativo</li>
                <li>• <strong>Tipo</strong> - Tipo do produto (ex: Curso Gravado)</li>
                <li>• <strong>Valor Prateleira</strong> - Preço original (ex: R$997.00)</li>
                <li>• <strong>Valor Praticado</strong> - Preço atual (ex: R$497.00)</li>
              </ul>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">⚠️ Importante:</h4>
              <ul className="text-sm space-y-1 ml-4 text-muted-foreground">
                <li>• Use vírgula (,) como separador de colunas</li>
                <li>• A primeira linha deve conter os cabeçalhos</li>
                <li>• Campos com texto longo podem usar aspas duplas</li>
                <li>• Certifique-se de que o arquivo está em UTF-8</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar Template
            </Button>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                handleImportCSV(e)
                setShowImportDialog(false)
              }}
              style={{ display: 'none' }}
              id="csv-upload-dialog"
              disabled={importing}
            />
            <Button
              onClick={() => document.getElementById('csv-upload-dialog')?.click()}
              disabled={importing}
              className="w-full sm:w-auto"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" />
                  Selecionar Arquivo CSV
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import CSV Info */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Importar Produtos via CSV
            </DialogTitle>
            <DialogDescription>
              Importe múltiplos produtos de uma vez usando um arquivo CSV
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">📋 Formato do CSV:</h4>
              <p className="text-sm text-muted-foreground mb-3">
                O arquivo CSV deve conter as seguintes colunas (na ordem):
              </p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• <strong>Nome do Produto</strong> - Nome do produto ou serviço</li>
                <li>• <strong>Acesso</strong> - Período de acesso (ex: 1 Ano)</li>
                <li>• <strong>CAMPANHAS</strong> - Tags de campanha (opcional)</li>
                <li>• <strong>Categoria</strong> - Categoria do produto</li>
                <li>• <strong>Descrição</strong> - Descrição detalhada</li>
                <li>• <strong>Pra que Serve</strong> - Benefícios e utilidade</li>
                <li>• <strong>Sigla</strong> - Sigla identificadora</li>
                <li>• <strong>Status</strong> - Ativo ou Inativo</li>
                <li>• <strong>Tipo</strong> - Tipo do produto (ex: Curso Gravado)</li>
                <li>• <strong>Valor Prateleira</strong> - Preço original (ex: R$997.00)</li>
                <li>• <strong>Valor Praticado</strong> - Preço atual (ex: R$497.00)</li>
              </ul>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">⚠️ Importante:</h4>
              <ul className="text-sm space-y-1 ml-4 text-muted-foreground">
                <li>• Use vírgula (,) como separador de colunas</li>
                <li>• A primeira linha deve conter os cabeçalhos</li>
                <li>• Campos com texto longo podem usar aspas duplas</li>
                <li>• Certifique-se de que o arquivo está em UTF-8</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar Template
            </Button>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                handleImportCSV(e)
                setShowImportDialog(false)
              }}
              style={{ display: 'none' }}
              id="csv-upload-dialog"
              disabled={importing}
            />
            <Button
              onClick={() => document.getElementById('csv-upload-dialog')?.click()}
              disabled={importing}
              className="w-full sm:w-auto"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" />
                  Selecionar Arquivo CSV
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import CSV Info */}
      {!creating && !editing && products.length === 0 && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <FileUp className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Importação em Massa
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Você pode importar todos os seus produtos de uma vez usando um arquivo CSV. 
                  Clique em "Template" para baixar um modelo com o formato correto.
                </p>
                <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                  <p><strong>Formato esperado:</strong> CSV com colunas: Nome do Produto, Descrição, Tipo, Valor Praticado, Status, etc.</p>
                  <p><strong>Produtos ativos:</strong> Apenas produtos com Status "Ativo" ou "Planejado" serão importados</p>
                  <p><strong>Preços:</strong> Aceita formatos como R$997.00, R$1.997,00, etc.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form (Create/Edit) */}
      {(creating || editing) && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? 'Editar Produto' : 'Novo Produto'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Auto-fill from URL */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <Label htmlFor="scrape-url" className="text-sm font-medium">
                  🔗 Auto-preencher com dados de URL
                </Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Cole o link de uma página de produto/curso e o sistema irá extrair automaticamente as informações
                </p>
                <div className="flex gap-2">
                  <Input
                    id="scrape-url"
                    type="url"
                    placeholder="https://exemplo.com/meu-produto"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleScrapeUrl(e.currentTarget.value)
                      }
                    }}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={(e) => {
                      const input = document.getElementById('scrape-url') as HTMLInputElement
                      if (input?.value) {
                        handleScrapeUrl(input.value)
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Nome do Produto *</Label>
                <Input
                  id="name"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  placeholder="Ex: Curso Completo de Qi Gong"
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Input
                  id="type"
                  value={formData.product_type}
                  onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                  placeholder="Ex: curso, mentoria, ebook, evento"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.product_description}
                onChange={(e) => setFormData({ ...formData, product_description: e.target.value })}
                placeholder="Descreva o produto..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.product_price_brl}
                  onChange={(e) => setFormData({ ...formData, product_price_brl: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="url">URL da Página de Vendas</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.product_url}
                  onChange={(e) => setFormData({ ...formData, product_url: e.target.value })}
                  placeholder="https://exemplo.com/produto"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Para usuários que NÃO possuem acesso
                </p>
              </div>
            </div>

            {/* Integração com Memberkit - Container Único */}
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-300 dark:border-blue-800">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label htmlFor="memberkit-select" className="text-sm font-medium flex items-center gap-2">
                    🔗 Vincular com Curso do Memberkit
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Selecione um curso já cadastrado na aba Memberkit para preencher automaticamente os campos abaixo
                  </p>
                  <select
                    id="memberkit-select"
                    onChange={(e) => handleMemberkitProductSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    disabled={memberkitProducts.length === 0}
                  >
                    <option value="">
                      {memberkitProducts.length === 0 
                        ? 'Nenhum curso cadastrado no Memberkit' 
                        : 'Selecione um curso...'}
                    </option>
                    {memberkitProducts.map((product) => (
                      <option key={product.id} value={product.product_id}>
                        {product.name} ({product.product_id})
                      </option>
                    ))}
                  </select>
                  {memberkitProducts.length === 0 && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      💡 Cadastre cursos na aba Memberkit primeiro
                    </p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="memberkit-url">URL do Memberkit (Acesso ao Curso)</Label>
                    <Input
                      id="memberkit-url"
                      type="url"
                      value={formData.memberkit_url}
                      onChange={(e) => setFormData({ ...formData, memberkit_url: e.target.value })}
                      placeholder="https://memberkit.com/curso"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Para usuários que JÁ possuem acesso
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="memberkit-id">ID do Produto no Memberkit</Label>
                    <Input
                      id="memberkit-id"
                      value={formData.memberkit_course_id}
                      onChange={(e) => setFormData({ ...formData, memberkit_course_id: e.target.value })}
                      placeholder="QIG, ADC, MAR..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Usado para verificar se usuário tem acesso
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="dor nas costas, iniciante, avançado"
                />
              </div>
              <div>
                <Label htmlFor="element">Elemento (opcional)</Label>
                <select
                  id="element"
                  value={formData.element}
                  onChange={(e) => setFormData({ ...formData, element: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">Todos os elementos</option>
                  <option value="MADEIRA">MADEIRA</option>
                  <option value="FOGO">FOGO</option>
                  <option value="TERRA">TERRA</option>
                  <option value="METAL">METAL</option>
                  <option value="ÁGUA">ÁGUA</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="recommended">Recomendado Para</Label>
              <Input
                id="recommended"
                value={formData.recommended_for}
                onChange={(e) => setFormData({ ...formData, recommended_for: e.target.value })}
                placeholder="Ex: Pessoas com ansiedade e estresse"
              />
            </div>

            <div>
              <Label htmlFor="benefits">Benefícios</Label>
              <Textarea
                id="benefits"
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                placeholder="Principais benefícios deste produto..."
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
              />
              <Label htmlFor="featured" className="cursor-pointer">
                Produto em destaque (aparece primeiro)
              </Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </Button>
              <Button variant="outline" onClick={cancelEdit}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <div className="grid gap-4 md:grid-cols-2">
        {products.map((product) => (
          <Card key={product.id} className={`hover:shadow-lg transition-shadow ${!product.is_available ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg mb-2 truncate">{product.product_name}</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    {product.is_featured && (
                      <Badge variant="default" className="bg-yellow-500 text-black uppercase text-xs">
                        Destaque
                      </Badge>
                    )}
                    <Badge variant={product.product_type === 'ebook' ? 'secondary' : 'default'} className="uppercase text-xs">
                      {product.product_type || 'Produto'}
                    </Badge>
                    {product.tags && product.tags
                      .filter(tag => tag.toLowerCase() !== product.product_type?.toLowerCase())
                      .map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-normal">
                          {tag}
                        </Badge>
                      ))
                    }
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Switch
                    checked={product.is_available}
                    onCheckedChange={() => toggleAvailable(product)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(product)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {product.product_description && (
                <p className="text-muted-foreground line-clamp-2">{product.product_description}</p>
              )}
              
              {product.product_price_brl && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-2xl text-primary">
                    R$ {product.product_price_brl.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
              
              {product.element && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {product.element}
                  </Badge>
                </div>
              )}

              {product.product_url && (
                <div className="pt-2 border-t">
                  <a 
                    href={product.product_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline inline-flex items-center gap-1"
                  >
                    🔗 Ver página de vendas
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {products.length === 0 && !creating && (
          <Card className="md:col-span-2">
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhum produto configurado. Clique em "Novo Produto" para começar.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
