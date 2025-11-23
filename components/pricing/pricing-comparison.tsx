'use client'

import { Check, X } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const comparisonData = [
  {
    feature: 'Créditos mensais',
    free: '20',
    aprendiz: '50',
    discipulo: '250',
    mestre: '600',
  },
  {
    feature: 'Créditos boas-vindas',
    free: '50',
    aprendiz: '-',
    discipulo: '-',
    mestre: '-',
  },
  {
    feature: 'Histórico de conversas',
    free: '7 dias',
    aprendiz: '30 dias',
    discipulo: 'Ilimitado',
    mestre: 'Ilimitado',
  },
  {
    feature: 'Áudio (Text-to-Speech)',
    free: false,
    aprendiz: false,
    discipulo: true,
    mestre: true,
  },
  {
    feature: 'Áudio bidirecional',
    free: false,
    aprendiz: false,
    discipulo: false,
    mestre: true,
  },
  {
    feature: 'Upload de imagens',
    free: false,
    aprendiz: false,
    discipulo: false,
    mestre: true,
  },
  {
    feature: 'Biblioteca de exercícios',
    free: 'Básica',
    aprendiz: 'Básica',
    discipulo: 'Completa',
    mestre: 'Completa',
  },
  {
    feature: 'Suporte',
    free: 'Email',
    aprendiz: 'Email',
    discipulo: 'Prioritário 48h',
    mestre: 'VIP 24h',
  },
  {
    feature: 'Relatórios de progresso',
    free: false,
    aprendiz: false,
    discipulo: false,
    mestre: true,
  },
]

function CellContent({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-5 w-5 text-green-500 mx-auto" />
    ) : (
      <X className="h-5 w-5 text-muted-foreground mx-auto" />
    )
  }
  return <span className="text-sm">{value}</span>
}

export function PricingComparison() {
  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Recurso</TableHead>
            <TableHead className="text-center">FREE</TableHead>
            <TableHead className="text-center">Aprendiz</TableHead>
            <TableHead className="text-center bg-primary/5">
              <div className="flex items-center justify-center gap-1">
                <span>Discípulo</span>
                <span className="text-xs">⭐</span>
              </div>
            </TableHead>
            <TableHead className="text-center">Mestre</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comparisonData.map((row, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">{row.feature}</TableCell>
              <TableCell className="text-center">
                <CellContent value={row.free} />
              </TableCell>
              <TableCell className="text-center">
                <CellContent value={row.aprendiz} />
              </TableCell>
              <TableCell className="text-center bg-primary/5">
                <CellContent value={row.discipulo} />
              </TableCell>
              <TableCell className="text-center">
                <CellContent value={row.mestre} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
