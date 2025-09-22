'use client';
import { ReactNode } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Sidebar } from '@/components/Sidebar';

interface SettingsLayoutProps {
  children: ReactNode;
}

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
).catch(error => {
  console.error('Failed to load Stripe.js:', error);
  throw new Error(
    'Failed to load Stripe.js. Please check your internet connection and try again.'
  );
});

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className='flex min-h-screen bg-gray-50/50 flex-col md:flex-row'>
      <Sidebar />
      <Elements stripe={stripePromise}>
        <main className='flex-1 py-6'>{children}</main>
      </Elements>
    </div>
  );
}
