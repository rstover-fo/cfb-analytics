import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar, Header } from '@/components/layout';
import { ErrorBoundary } from '@/components/error-boundary';
import { OfflineBanner } from '@/components/ui/offline-banner';
import { QueryProvider } from '@/providers/query-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CFB Analytics | Oklahoma Sooners',
  description:
    'College football analytics platform for Oklahoma Sooners fans - historical stats, game analysis, recruiting, and more.',
  other: {
    'theme-color': '#1a1a1a',
    'color-scheme': 'dark',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <a
          href="#main-content"
          className="focus:bg-background focus:text-foreground focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:px-4 focus:py-2 focus:ring-2"
        >
          Skip to main content
        </a>
        <ErrorBoundary>
          <QueryProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <Header />
                <main id="main-content" className="flex-1 overflow-auto p-4 md:p-6">
                  {children}
                </main>
              </SidebarInset>
            </SidebarProvider>
          </QueryProvider>
        </ErrorBoundary>
        <OfflineBanner />
      </body>
    </html>
  );
}
