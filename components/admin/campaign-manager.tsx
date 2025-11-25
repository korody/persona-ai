'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Plus, Trash2, Edit2, Save, X, Upload } from 'lucide-react'
import type { AvatarCampaign } from '@/types/marketing'

interface CampaignFormData {
  campaign_name: string
  campaign_description: string
  campaign_cta: string
  campaign_url: string
  start_date: string
  end_date: string
  priority: number
  target_audience: string
  suggested_moments: string
}

export function CampaignManager({ avatarSlug }: { avatarSlug: string }) {
  const [campaigns, setCampaigns] = useState<AvatarCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState<CampaignFormData>({
    campaign_name: '',
    campaign_description: '',
    campaign_cta: '',
    campaign_url: '',
    start_date: '',
    end_date: '',
    priority: 0,
    target_audience: '',
    suggested_moments: ''
  })

  const supabase = createClient()

  useEffect(() => {
    loadCampaigns()
  }, [avatarSlug])

  async function loadCampaigns() {
    setLoading(true)
    const { data, error } = await supabase
      .from('avatar_campaigns')
      .select('*')
      .eq('avatar_slug', avatarSlug)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (!error && data) {
      setCampaigns(data)
    }
    setLoading(false)
  }

  async function handleSave() {
    const dataToSave = {
      ...formData,
      avatar_slug: avatarSlug,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null
    }

    if (editing) {
      // Update
      const { error } = await supabase
        .from('avatar_campaigns')
        .update(dataToSave)
        .eq('id', editing)

      if (!error) {
        setEditing(null)
        loadCampaigns()
      }
    } else {
      // Create
      const { error } = await supabase
        .from('avatar_campaigns')
        .insert([dataToSave])

      if (!error) {
        setCreating(false)
        resetForm()
        loadCampaigns()
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta campanha?')) return

    const { error } = await supabase
      .from('avatar_campaigns')
      .delete()
      .eq('id', id)

    if (!error) {
      loadCampaigns()
    }
  }

  async function toggleActive(campaign: AvatarCampaign) {
    const { error } = await supabase
      .from('avatar_campaigns')
      .update({ is_active: !campaign.is_active })
      .eq('id', campaign.id)

    if (!error) {
      loadCampaigns()
    }
  }

  function startEdit(campaign: AvatarCampaign) {
    setEditing(campaign.id)
    setFormData({
      campaign_name: campaign.campaign_name,
      campaign_description: campaign.campaign_description || '',
      campaign_cta: campaign.campaign_cta || '',
      campaign_url: campaign.campaign_url || '',
      start_date: campaign.start_date ? campaign.start_date.split('T')[0] : '',
      end_date: campaign.end_date ? campaign.end_date.split('T')[0] : '',
      priority: campaign.priority,
      target_audience: campaign.target_audience || '',
      suggested_moments: campaign.suggested_moments || ''
    })
  }

  function resetForm() {
    setFormData({
      campaign_name: '',
      campaign_description: '',
      campaign_cta: '',
      campaign_url: '',
      start_date: '',
      end_date: '',
      priority: 0,
      target_audience: '',
      suggested_moments: ''
    })
  }

  function cancelEdit() {
    setEditing(null)
    setCreating(false)
    resetForm()
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
          campaign_name: result.data.product_name || formData.campaign_name,
          campaign_description: result.data.product_description || formData.campaign_description,
          campaign_url: result.data.product_url || formData.campaign_url,
          campaign_cta: formData.campaign_cta || 'Saiba mais'
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
          <h2 className="text-2xl font-bold">Campanhas de Marketing</h2>
          <p className="text-sm text-muted-foreground">
            Configure campanhas ativas que a IA pode mencionar nas conversas
          </p>
        </div>
        {!creating && !editing && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Campanha
          </Button>
        )}
      </div>

      {/* Form (Create/Edit) */}
      {(creating || editing) && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? 'Editar Campanha' : 'Nova Campanha'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Auto-fill from URL */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <Label htmlFor="scrape-url-campaign" className="text-sm font-medium">
                  🔗 Auto-preencher com dados de URL
                </Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Cole o link de uma página de evento/curso/produto e o sistema irá extrair automaticamente as informações
                </p>
                <div className="flex gap-2">
                  <Input
                    id="scrape-url-campaign"
                    type="url"
                    placeholder="https://exemplo.com/evento-especial"
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
                      const input = document.getElementById('scrape-url-campaign') as HTMLInputElement
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
                <Label htmlFor="name">Nome da Campanha *</Label>
                <Input
                  id="name"
                  value={formData.campaign_name}
                  onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                  placeholder="Ex: Black November Qigong Brasil"
                />
              </div>
              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maior valor = maior prioridade
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.campaign_description}
                onChange={(e) => setFormData({ ...formData, campaign_description: e.target.value })}
                placeholder="Descreva a campanha..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="cta">Call to Action (CTA)</Label>
                <Input
                  id="cta"
                  value={formData.campaign_cta}
                  onChange={(e) => setFormData({ ...formData, campaign_cta: e.target.value })}
                  placeholder="Ex: Inscreva-se agora!"
                />
              </div>
              <div>
                <Label htmlFor="url">URL da Campanha</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.campaign_url}
                  onChange={(e) => setFormData({ ...formData, campaign_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="start">Data de Início</Label>
                <Input
                  id="start"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end">Data de Término</Label>
                <Input
                  id="end"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="audience">Público-alvo</Label>
              <Input
                id="audience"
                value={formData.target_audience}
                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                placeholder="Ex: Pessoas interessadas em eventos presenciais"
              />
            </div>

            <div>
              <Label htmlFor="moments">Quando Mencionar</Label>
              <Textarea
                id="moments"
                value={formData.suggested_moments}
                onChange={(e) => setFormData({ ...formData, suggested_moments: e.target.value })}
                placeholder="Ex: Quando usuário perguntar sobre eventos, cursos presenciais ou imersões"
                rows={2}
              />
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
      <div className="space-y-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className={!campaign.is_active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {campaign.campaign_name}
                    {campaign.is_active && (
                      <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                        ATIVA
                      </span>
                    )}
                    {campaign.priority > 0 && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                        Prioridade: {campaign.priority}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>{campaign.campaign_description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={campaign.is_active}
                    onCheckedChange={() => toggleActive(campaign)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(campaign)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(campaign.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {campaign.campaign_cta && (
                <p><strong>CTA:</strong> {campaign.campaign_cta}</p>
              )}
              {campaign.campaign_url && (
                <p><strong>URL:</strong> <a href={campaign.campaign_url} target="_blank" rel="noopener" className="text-blue-500 hover:underline">{campaign.campaign_url}</a></p>
              )}
              {campaign.target_audience && (
                <p><strong>Público:</strong> {campaign.target_audience}</p>
              )}
              {campaign.suggested_moments && (
                <p><strong>Quando mencionar:</strong> {campaign.suggested_moments}</p>
              )}
              {(campaign.start_date || campaign.end_date) && (
                <p className="text-muted-foreground">
                  {campaign.start_date && `Início: ${new Date(campaign.start_date).toLocaleDateString('pt-BR')}`}
                  {campaign.start_date && campaign.end_date && ' • '}
                  {campaign.end_date && `Término: ${new Date(campaign.end_date).toLocaleDateString('pt-BR')}`}
                </p>
              )}
            </CardContent>
          </Card>
        ))}

        {campaigns.length === 0 && !creating && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhuma campanha configurada. Clique em "Nova Campanha" para começar.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
