'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileQuestion, Home, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Custom 404 page displayed when a route doesn't exist.
 * Provides helpful navigation options to guide users back to valid content.
 */
export default function NotFound() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl">Page not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          </p>
          <div className="text-muted-foreground text-sm">
            <p>Try one of these instead:</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <div className="flex w-full gap-2">
            <Button asChild variant="default" className="flex-1">
              <Link href="/" className="flex items-center justify-center gap-2">
                <Home className="h-4 w-4" aria-hidden="true" />
                Home
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/schedule" className="flex items-center justify-center gap-2">
                <Search className="h-4 w-4" aria-hidden="true" />
                Schedule
              </Link>
            </Button>
          </div>
          <Button
            variant="ghost"
            className="text-muted-foreground w-full"
            onClick={handleGoBack}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Go back
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
