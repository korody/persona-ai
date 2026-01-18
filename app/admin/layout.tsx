import { ReactNode } from 'react'
import { AdminNav } from '@/components/admin/admin-nav'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminNav />
      {children}
    </div>
  )
}
