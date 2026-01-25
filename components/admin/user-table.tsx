'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  MoreHorizontal, 
  CreditCard, 
  Clock, 
  User,
  ArrowUpDown,
  Filter,
  Check,
  MessageSquare
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { UserInteractionsModal } from './user-interactions-modal'

interface UserTableProps {
  users: any[]
  onViewDetails: (user: any) => void
}

type SortField = 'date' | 'name' | 'credits'
type SortOrder = 'asc' | 'desc'
type FilterType = 'all' | 'has_credits' | 'no_credits' | 'has_bonus'

export function UserTable({ users, onViewDetails }: UserTableProps) {
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [filterType, setFilterType] = useState<FilterType>('all')
  
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showInteractions, setShowInteractions] = useState(false)

  const handleViewInteractions = (user: any) => {
    setSelectedUser(user)
    setShowInteractions(true)
  }

  const filteredUsers = users
    .filter((user) => {
      const searchLower = search.toLowerCase()
      const matchesSearch = (
        user.email?.toLowerCase().includes(searchLower) ||
        user.full_name?.toLowerCase().includes(searchLower)
      )

      if (!matchesSearch) return false

      const balance = user.credits?.[0]?.balance || 0
      const bonus = user.credits?.[0]?.bonus_balance || 0

      const total = balance + bonus

      if (filterType === 'has_credits') return total > 0
      if (filterType === 'no_credits') return total === 0
      // if (filterType === 'has_bonus') return bonus > 0 // Removed as requested

      return true
    })
    .sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'name':
          comparison = (a.full_name || a.email || '').localeCompare(b.full_name || b.email || '')
          break
        case 'credits':
          const totalA = (a.credits?.[0]?.balance || 0) + (a.credits?.[0]?.bonus_balance || 0)
          const totalB = (b.credits?.[0]?.balance || 0) + (b.credits?.[0]?.bonus_balance || 0)
          comparison = totalA - totalB
          break
        case 'date':
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc') // Default to desc for new field
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email ou nome..."
              className="pl-10 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 border-l pl-2 ml-2 h-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 px-2 text-muted-foreground hover:text-foreground">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Classificar
                  {sortField === 'date' && <span className="ml-1 text-xs opacity-50">(Data)</span>}
                  {sortField === 'name' && <span className="ml-1 text-xs opacity-50">(Nome)</span>}
                  {sortField === 'credits' && <span className="ml-1 text-xs opacity-50">(Créditos)</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Classificar por</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem 
                  checked={sortField === 'date'} 
                  onCheckedChange={() => toggleSort('date')}
                >
                  Data de Cadastro
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={sortField === 'name'} 
                  onCheckedChange={() => toggleSort('name')}
                >
                  Nome
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={sortField === 'credits'} 
                  onCheckedChange={() => toggleSort('credits')}
                >
                  Saldo de Créditos
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  {sortOrder === 'asc' ? 'Ascendente (A-Z)' : 'Descendente (Z-A)'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={
                  `h-9 px-2 ${filterType !== 'all' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`
                }>
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Status de Créditos</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem 
                  checked={filterType === 'all'} 
                  onCheckedChange={() => setFilterType('all')}
                >
                  Todos
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={filterType === 'has_credits'} 
                  onCheckedChange={() => setFilterType('has_credits')}
                >
                  Com Créditos
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={filterType === 'no_credits'} 
                  onCheckedChange={() => setFilterType('no_credits')}
                >
                  Sem Créditos
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          {filteredUsers.length} usuários
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('name')}>
                Usuário {sortField === 'name' && <ArrowUpDown className="inline h-3 w-3 ml-1" />}
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('date')}>
                Cadastro {sortField === 'date' && <ArrowUpDown className="inline h-3 w-3 ml-1" />}
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('credits')}>
                Créditos {sortField === 'credits' && <ArrowUpDown className="inline h-3 w-3 ml-1" />}
              </TableHead>
              <TableHead>Último Acesso</TableHead>
              <TableHead>Perguntas</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const balance = user.credits?.[0]?.balance || 0
                const bonus = user.credits?.[0]?.bonus_balance || 0
                const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null
                
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.full_name || 'Usuário'}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={balance + bonus > 0 ? "secondary" : "outline"}>
                          {balance + bonus} créditos
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        {lastSignIn ? (
                          <div className="flex flex-col">
                            <span>{lastSignIn.toLocaleDateString('pt-BR')}</span>
                            <span className="text-muted-foreground">{lastSignIn.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{user.total_messages || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onViewDetails(user)}>
                            <User className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewInteractions(user)}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Ver Interações
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" disabled>
                            Suspender Usuário
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <UserInteractionsModal 
        user={selectedUser} 
        isOpen={!!selectedUser && showInteractions}
        onClose={() => {
          setSelectedUser(null)
          setShowInteractions(false)
        }} 
      />
    </div>
  )
}
