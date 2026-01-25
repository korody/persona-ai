'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserTable } from '@/components/admin/user-table'
import { UserDetailModal } from '@/components/admin/user-detail-modal'
import { getUsers } from '@/lib/admin/actions'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      setLoading(true)
      const data = await getUsers()
      setUsers(data || [])
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (user: any) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedUser(null)
    loadUsers() // Reload to get updated credits
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold">Gestão de Usuários</h1>
                <p className="text-muted-foreground">Visualize e gerencie os usuários da plataforma.</p>
              </div>
            </div>
          </div>
          
          <Button onClick={loadUsers} variant="outline" disabled={loading}>
             {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
             Atualizar Lista
          </Button>
        </div>

        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <UserTable users={users} onViewDetails={handleOpenModal} />
        )}

        <UserDetailModal 
          user={selectedUser} 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
        />
      </main>
    </div>
  )
}
