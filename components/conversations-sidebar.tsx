// components/conversations-sidebar.tsx

'use client'

import { useConversations } from '@/hooks/use-conversations'
import { formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { useState } from 'react'

interface ConversationsSidebarProps {
  onNewConversation?: () => void
  onSelectConversation?: (conversationId: string) => void
  currentConversationId?: string | null
}

export function ConversationsSidebar({ 
  onNewConversation, 
  onSelectConversation,
  currentConversationId 
}: ConversationsSidebarProps) {
  const { conversations, isLoading, mutate } = useConversations()
  const supabase = createClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const handleRename = async (id: string, newTitle: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ title: newTitle })
      })

      if (response.ok) {
        mutate()
        setEditingId(null)
      }
    } catch (error) {
      console.error('Error renaming conversation:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conversa?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        mutate()
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="w-64 border-r bg-muted/10 p-4">
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-muted/50 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 border-r bg-muted/10 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <Button 
          onClick={onNewConversation} 
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Conversa
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2">
        {conversations && conversations.length > 0 ? (
          <div className="space-y-1">
            {conversations.map((conv) => {
              const isActive = currentConversationId === conv.id
              const isEditing = editingId === conv.id
              
              return (
                <div
                  key={conv.id}
                  className={`
                    group relative rounded-lg transition-colors cursor-pointer
                    ${
                      isActive
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted/50'
                    }
                  `}
                >
                  {isEditing ? (
                    <div className="p-3">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRename(conv.id, editingTitle)
                          } else if (e.key === 'Escape') {
                            setEditingId(null)
                          }
                        }}
                        onBlur={() => handleRename(conv.id, editingTitle)}
                        className="w-full px-2 py-1 text-sm border rounded"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <>
                      <div
                        onClick={() => onSelectConversation?.(conv.id)}
                        className="block p-3"
                      >
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {conv.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(conv.last_message_at)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {conv.total_credits_used}{' '}
                              {conv.total_credits_used === 1
                                ? 'crédito'
                                : 'créditos'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => e.preventDefault()}
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault()
                                setEditingId(conv.id)
                                setEditingTitle(conv.title)
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Renomear
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault()
                                handleDelete(conv.id)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma conversa ainda</p>
            <p className="text-xs mt-1">
              Comece uma nova conversa com o Mestre Ye
            </p>
          </div>
        )}
      </div>
    </div>
  )
}