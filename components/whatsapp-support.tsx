'use client'

import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function WhatsAppSupport() {
  const whatsappNumber = '5511963982121' // Número no formato internacional sem símbolos
  const message = encodeURIComponent('Olá! Preciso de Suporte Técnico com o Mestre Ye Digital')

  const openWhatsApp = () => {
    const url = `https://wa.me/${whatsappNumber}?text=${message}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Button
      onClick={openWhatsApp}
      size="icon"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform z-50 bg-green-600 hover:bg-green-700"
      aria-label="Suporte técnico via WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  )
}
