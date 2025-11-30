// components/ModalWrapper.tsx (Client Component)
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'; // Import the useSession hook
import PopupModal from '@/components/PopupModal';

// This component will show the modal if the user is not signed in
export default function ModalWrapper() {
  const { status } = useSession(); // Get session status
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // If the user is signed in, don't show the modal
    if (status === 'authenticated') return;

    // Optionally, you can control when the modal appears, e.g., after some time
    const timer = setTimeout(() => setOpen(true), 1000); // Show the modal after 1s
    return () => clearTimeout(timer);
  }, [status]);

  // Only render the modal if the user is not signed in
  if (status === 'authenticated' || status === 'loading') return null;

  return <PopupModal open={open} setOpen={setOpen} booksImage='/books.jpg' />; // Next.js will auto-optimize
}
