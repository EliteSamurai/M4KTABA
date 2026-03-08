// components/ModalWrapper.tsx (Client Component)
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'; // Import the useSession hook
import { usePathname } from 'next/navigation';
import PopupModal from '@/components/PopupModal';

// This component will show the modal if the user is not signed in
export default function ModalWrapper() {
  const { status } = useSession(); // Get session status
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const storageKey = 'sell_modal_last_shown_at';

  useEffect(() => {
    if (status !== 'unauthenticated' || pathname !== '/') return;
    if (typeof window === 'undefined') return;

    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const lastShownRaw = window.localStorage.getItem(storageKey);
    if (lastShownRaw) {
      const lastShown = Number(lastShownRaw);
      if (Number.isFinite(lastShown) && Date.now() - lastShown < sevenDaysMs) {
        return;
      }
    }

    let hasShown = false;
    const showModal = () => {
      if (hasShown) return;
      hasShown = true;
      setOpen(true);
      window.localStorage.setItem(storageKey, String(Date.now()));
    };

    // Less aggressive trigger than 1-second interrupt popup
    const timer = window.setTimeout(showModal, 12000);
    const handleMouseOut = (event: MouseEvent) => {
      if (event.clientY <= 0) {
        showModal();
      }
    };

    window.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('mouseout', handleMouseOut);
    };
  }, [status, pathname]);

  // Only render the modal if the user is not signed in
  if (status === 'authenticated' || status === 'loading') return null;

  return <PopupModal open={open} setOpen={setOpen} booksImage='/books.jpg' />; // Next.js will auto-optimize
}
