"use client";

import { ChevronUp, GraduationCap, Settings, CreditCard, LogOut } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LoaderIcon } from "./icons";

const ADMIN_EMAILS = ['marko@persona.cx', 'admin@persona.cx'];

export function SidebarUserNav() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const supabase = createClient();

  const userEmail = user?.email?.toLowerCase() ?? "";
  const isAdmin = ADMIN_EMAILS.includes(userEmail);

  // Debug - sempre que renderizar
  console.log('[SidebarUserNav] Render:', {
    userEmail,
    isAdmin,
    ADMIN_EMAILS,
    isLoading
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {isLoading ? (
              <SidebarMenuButton className="h-10 justify-between bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <div className="flex flex-row gap-2">
                  <div className="size-6 animate-pulse rounded-full bg-zinc-500/30" />
                  <span className="animate-pulse rounded-md bg-zinc-500/30 text-transparent">
                    Carregando...
                  </span>
                </div>
                <div className="animate-spin text-zinc-500">
                  <LoaderIcon />
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                className="h-10 bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                data-testid="user-nav-button"
              >
                <Image
                  alt={user?.email ?? "User Avatar"}
                  className="rounded-full"
                  height={24}
                  src={`https://avatar.vercel.sh/${user?.email}`}
                  width={24}
                />
                <span className="truncate" data-testid="user-email">
                  {user?.email || 'Usuário'}
                </span>
                <ChevronUp className="ml-auto" />
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-popper-anchor-width)"
            data-testid="user-nav-menu"
            side="top"
          >
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => router.push('/settings')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => router.push('/pricing')}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Meus Créditos
            </DropdownMenuItem>
            
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer bg-green-500/10 text-green-600 dark:text-green-400"
                  onSelect={() => router.push('/admin/avatars/mestre-ye/train')}
                >
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Painel de Treinamento
                </DropdownMenuItem>

              </>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600"
              onSelect={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
