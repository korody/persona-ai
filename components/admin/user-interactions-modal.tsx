'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from '@/components/ui/badge'
import { Loader2, MessageSquare, User, Bot, Clock } from 'lucide-react'
import { getUserInteractions } from '@/lib/admin/actions'

interface UserInteractionsModalProps {
  user: any
  isOpen: boolean
  onClose: () => void
}

export function UserInteractionsModal({ user, isOpen, onClose }: UserInteractionsModalProps) {
  const [loading, setLoading] = useState(true)
  const [interactions, setInteractions] = useState<any[]>([])

  useEffect(() => {
    if (isOpen && user?.id) {
      setLoading(true)
      getUserInteractions(user.id)
        .then(data => {
          setInteractions(data)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [isOpen, user])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Interações de {user?.full_name || user?.email}</DialogTitle>
          <DialogDescription>
            Histórico completo de conversas e mensagens.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : interactions.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
              <p>Nenhuma interação encontrada.</p>
            </div>
          ) : (
            <ScrollArea className="h-full pr-4">
              <Accordion type="single" collapsible className="w-full">
                {interactions.map((conv) => (
                  <AccordionItem key={conv.id} value={conv.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-col items-start gap-1 text-left">
                        <span className="font-medium text-sm">{conv.title || 'Nova Conversa'}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(conv.last_message_at).toLocaleString('pt-BR')}
                          <Badge variant="secondary" className="text-[10px] h-4">
                            {conv.messages.length} msgs
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2 pb-4 px-2">
                        {conv.messages.map((msg: any) => (
                          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role !== 'user' && (
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                                <Bot className="h-3 w-3 text-primary" />
                              </div>
                            )}
                            <div className={`rounded-lg px-3 py-2 max-w-[80%] text-sm ${
                              msg.role === 'user' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}>
                              {msg.content}
                            </div>
                            {msg.role === 'user' && (
                              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                                <User className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
