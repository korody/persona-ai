'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: 'O que é 1 crédito?',
    answer: '1 crédito = 1 turno completo de conversa (sua pergunta + resposta do Mestre Ye). Por exemplo, uma conversa típica de 5-8 perguntas usa 5-8 créditos.',
  },
  {
    question: 'Os créditos expiram?',
    answer: 'Créditos mensais resetam no início de cada ciclo de cobrança. Créditos bônus (plano FREE) têm validade específica de 6 meses.',
  },
  {
    question: 'Posso mudar de plano?',
    answer: 'Sim! Você pode fazer upgrade ou downgrade a qualquer momento. Mudanças entram em vigor no próximo ciclo de cobrança.',
  },
  {
    question: 'Tem garantia de reembolso?',
    answer: 'Sim! Oferecemos garantia de 7 dias no primeiro pagamento. Se não ficar satisfeito, devolvemos 100% do valor.',
  },
  {
    question: 'E se meus créditos acabarem?',
    answer: 'Você pode fazer upgrade de plano a qualquer momento ou aguardar o reset mensal. No futuro, também ofereceremos pacotes avulsos de créditos.',
  },
  {
    question: 'O Mestre Ye substitui consulta médica?',
    answer: 'Não. O Mestre Ye é uma ferramenta educacional sobre Medicina Tradicional Chinesa. Sempre consulte profissionais de saúde habilitados para diagnósticos e tratamentos.',
  },
  {
    question: 'Como funciona o plano FREE?',
    answer: 'Você recebe 50 créditos de boas-vindas e mais 20 créditos por mês durante 6 meses. Após esse período, você pode continuar usando com os créditos acumulados ou fazer upgrade para um plano pago.',
  },
  {
    question: 'Quais formas de pagamento são aceitas?',
    answer: 'Aceitamos cartões de crédito via Stripe (Visa, Mastercard, American Express, Elo). O pagamento é processado de forma 100% segura e criptografada.',
  },
]

export function PricingFAQ() {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
