'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CampaignManager } from '@/components/admin/campaign-manager'
import { ProductManager } from '@/components/admin/product-manager'
import { Megaphone, ShoppingCart } from 'lucide-react'

export default function MarketingPage() {
  const avatarSlug = 'mestre-ye'

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">📢 Marketing & Produtos</h1>
          <p className="text-muted-foreground">
            Configure campanhas e produtos que a IA pode mencionar nas conversas
          </p>
        </div>

        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="campaigns">
              <Megaphone className="mr-2 h-4 w-4" />
              Campanhas
            </TabsTrigger>
            <TabsTrigger value="products">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Produtos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns">
            <CampaignManager avatarSlug={avatarSlug} />
          </TabsContent>

          <TabsContent value="products">
            <ProductManager avatarSlug={avatarSlug} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
