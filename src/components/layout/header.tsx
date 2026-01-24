'use client';

import { Menu } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

export function Header() {
  const { toggleSidebar, isMobile } = useSidebar();

  return (
    <header className="bg-sidebar border-sidebar-border flex h-14 items-center gap-4 border-b px-4">
      {isMobile && (
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      )}
      <div className="flex flex-1 items-center gap-4">
        <h1 className="text-foreground text-lg font-semibold md:hidden">CFB Analytics</h1>
      </div>
    </header>
  );
}
