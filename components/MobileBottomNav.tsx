/**
 * MobileBottomNav
 * Fixed bottom navigation bar for mobile devices (md:hidden).
 *
 * Augments — does not replace — the existing hamburger/drawer nav in Navbar.
 * Primary tabs: Home, Browse, Cart, Account.
 * Cart opens the shared CartSheet modal (via CartContext) so users can
 * review items before checkout — logged-out users can still see their cart.
 * Account routes logged-in users to /dashboard, logged-out to /login?callbackUrl=/dashboard.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart } from '@/contexts/CartContext';
import {
  Home,
  LayoutGrid,
  ShoppingCart,
  User,
} from 'lucide-react';

const tabs = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Browse', href: '/all', icon: LayoutGrid },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { getCartCount, openCartSheet } = useCart();
  const itemCount = getCartCount();

  const accountHref = session?.user ? '/dashboard' : '/login?callbackUrl=/dashboard';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-50 border-t border-gray-200 flex justify-around items-center h-16 z-40">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className="relative flex flex-col items-center justify-center w-full h-full"
          >
            <div className="relative">
              <Icon
                fill={isActive ? 'currentColor' : 'none'}
                className={isActive ? 'text-blue-600' : 'text-gray-500'}
                size={24}
              />
            </div>
            <span className={`text-xs mt-1 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
              {tab.name}
            </span>
          </Link>
        );
      })}

      {/* Cart tab — opens CartSheet modal via context */}
      <button
        onClick={openCartSheet}
        className="relative flex flex-col items-center justify-center w-full h-full"
        aria-label="Open cart"
      >
        <div className="relative">
          <ShoppingCart
            fill={pathname === '/checkout' ? 'currentColor' : 'none'}
            className={pathname === '/checkout' ? 'text-blue-600' : 'text-gray-500'}
            size={24}
          />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {itemCount > 9 ? '9+' : itemCount}
            </span>
          )}
        </div>
        <span className={`text-xs mt-1 ${pathname === '/checkout' ? 'text-blue-600' : 'text-gray-500'}`}>
          Cart
        </span>
      </button>

      {/* Account tab with session-aware routing */}
      <Link
        href={accountHref}
        className="relative flex flex-col items-center justify-center w-full h-full"
      >
        <User
          fill={pathname === '/dashboard' ? 'currentColor' : 'none'}
          className={pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-500'}
          size={24}
        />
        <span className={`text-xs mt-1 ${pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-500'}`}>
          Account
        </span>
      </Link>
    </nav>
  );
}