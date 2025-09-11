'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { TrustBadges } from '@/components/trust/TrustBadges';

interface MobileNavProps {
  links: Array<{ href: string; text: string }>;
}

export function MobileNav({ links }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant='ghost'
          className='mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden'
        >
          <Menu className='h-5 w-5' />
          <span className='sr-only'>Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side='left'>
        <SheetHeader className='px-1'>
          <SheetTitle className='text-lg font-bold tracking-tight'>
            M4KTABA
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className='my-4 h-[calc(100vh-8rem)] pb-10'>
          <div className='flex flex-col space-y-4'>
            <div className='space-y-3'>
              {links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-2 py-2 text-base transition-colors hover:text-foreground/80 rounded-md hover:bg-muted',
                    pathname === link.href
                      ? 'font-medium text-foreground bg-muted'
                      : 'text-foreground/60'
                  )}
                >
                  {link.text}
                </Link>
              ))}
            </div>

            <div className='border-t pt-4'>
              <Link href='/sell'>
                <Button
                  className='w-full bg-purple-600 text-white hover:bg-purple-700'
                  size='sm'
                >
                  Sell Books
                </Button>
              </Link>
            </div>

            <div className='border-t pt-4'>
              <Link href='/help'>
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  size='sm'
                >
                  Help & Support
                </Button>
              </Link>
            </div>

            <div className='pt-4'>
              <TrustBadges variant='compact' />
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
