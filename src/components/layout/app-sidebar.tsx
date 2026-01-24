'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeftRight,
  ArrowRightLeft,
  BarChart3,
  Calendar,
  GitCompare,
  GraduationCap,
  Home,
  PlayCircle,
  TrendingUp,
  Users,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const mainNavItems = [
  { title: 'Dashboard', href: '/', icon: Home },
  { title: 'Games', href: '/games', icon: Calendar },
];

const analysisNavItems = [
  { title: 'Play-by-Play', href: '/plays', icon: PlayCircle },
  { title: 'Trends', href: '/trends', icon: TrendingUp },
  { title: 'Head-to-Head', href: '/rivals', icon: GitCompare },
  { title: 'Metrics', href: '/metrics', icon: BarChart3 },
  { title: 'Compare', href: '/compare', icon: ArrowLeftRight },
];

const rosterNavItems = [
  { title: 'Recruiting', href: '/recruiting', icon: GraduationCap },
  { title: 'Transfer Portal', href: '/recruiting/portal', icon: ArrowRightLeft },
  { title: 'Roster', href: '/roster', icon: Users },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-sidebar-border border-b px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <span className="text-primary-foreground text-sm font-bold">OU</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sidebar-foreground text-sm font-semibold">CFB Analytics</span>
            <span className="text-sidebar-foreground/60 text-xs">Oklahoma Sooners</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Analysis</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analysisNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Roster</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {rosterNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
