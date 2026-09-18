'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import CheckoutButton from './CheckoutButton';
import { usePathname } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useOptimisticQty } from '@/hooks/useOptimisticQty';
import { useFlag } from '@/lib/flags';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import SellerBadge from '@/components/SellerBadge';

function CartItemRow({
  item,
}: {
  item: ReturnType<typeof useCart>['cart'][number];
}) {
  const { removeFromCart, updateItemQuantity } = useCart();
  const optimisticEnabled = useFlag('optimistic_qty');
  const { applyQty } = useOptimisticQty(item.id, item.quantity);
  return (
    <div className='flex items-start justify-between gap-4'>
      <div className='space-y-1'>
        <h4 className='font-medium leading-none'>{item.title}</h4>
        <p className='text-sm text-muted-foreground'>
          ${item.price} × {item.quantity}
        </p>
        {item.user && (
          <SellerBadge
            sellerId={item.user._id}
            sellerName={item.user.name}
            sellerEmail={item.user.email}
            showRating={false}
            className='mt-1'
          />
        )}
      </div>
      <div className='flex items-center gap-2'>
        <button
          className='h-8 w-8 rounded border text-sm'
          aria-label='Decrease quantity'
          onClick={() =>
            optimisticEnabled
              ? applyQty(Math.max(1, item.quantity - 1))
              : updateItemQuantity(item.id, item.quantity - 1)
          }
          disabled={item.quantity <= 1}
        >
          −
        </button>
        <span className='min-w-[2ch] text-center'>{item.quantity}</span>
        <button
          className='h-8 w-8 rounded border text-sm'
          aria-label='Increase quantity'
          onClick={() =>
            optimisticEnabled
              ? applyQty(item.quantity + 1)
              : updateItemQuantity(item.id, item.quantity + 1)
          }
        >
          +
        </button>
        <Button
          variant='ghost'
          size='sm'
          className='h-8 hover:bg-destructive hover:text-destructive-foreground'
          onClick={() => removeFromCart(item.id)}
        >
          Remove
        </Button>
      </div>
    </div>
  );
}

export function CartSheet({ 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  // Use controlled state if provided, otherwise use internal state
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isOpen = isControlled ? controlledOpen! : internalOpen;
  const setIsOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;
  
  const { cart, getCartTotal, getCartCount } = useCart();
  const pathname = usePathname();

  useEffect(() => {
    if (isControlled) return; // Don't close from internal state when controlled
    setIsOpen(false);
  }, [pathname, isControlled]);

  // The sheet content (shared between controlled and uncontrolled modes)
  const sheetContent = (
    <>
      <SheetContent className='flex flex-col'>
        <SheetHeader className='space-y-2.5'>
          <SheetTitle>Cart</SheetTitle>
          <SheetDescription>
            {getCartCount()} {getCartCount() === 1 ? 'item' : 'items'} in your
            cart
            {new Set(cart.map((i) => i.user?._id || 'unknown')).size > 1 &&
              ` · ships from ${new Set(cart.map((i) => i.user?._id || 'unknown')).size} sellers`}
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className='flex-1 -mx-6 px-6'>
          <div className='mt-6 space-y-6'>
            {cart.map(item => (
              <CartItemRow key={item.id} item={item} />
            ))}
          </div>
        </ScrollArea>
        <div className='border-t pt-4'>
          <div className='space-y-4'>
            <div className='flex items-center justify-between text-base font-medium'>
              <span>Total</span>
              <span>${getCartTotal().toFixed(2)}</span>
            </div>
            <CheckoutButton />
          </div>
        </div>
      </SheetContent>
    </>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {!isControlled && (
        <SheetTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            className='relative w-9 h-9 transition-colors hover:bg-muted'
            aria-label='Open cart'
          >
            <ShoppingCart className='h-5 w-5' />
            {getCartCount() > 0 && (
              <Badge
                variant='destructive'
                className='absolute -right-2 -top-2 h-5 w-5 justify-center rounded-full p-0'
              >
                {getCartCount()}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
      )}
      {sheetContent}
    </Sheet>
  );
}

/**
 * ControlledCartSheet — a headless version of CartSheet that is driven by
 * CartContext.  Rendered once at the root layout so that ANY component
 * (Navbar, MobileBottomNav) can open / close it via `openCartSheet()`.
 */
export function ControlledCartSheet() {
  const { isCartSheetOpen, closeCartSheet } = useCart();
  return <CartSheet open={isCartSheetOpen} onOpenChange={closeCartSheet} />;
}
