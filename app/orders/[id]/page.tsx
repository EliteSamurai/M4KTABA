'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { OrderStatus } from '@/components/OrderStatus';

export default function OrderPage({ params }: { params: { id: string } }) {
  const { status } = useSession();
  const router = useRouter();
  const [order, setOrder] = useState<{
    id: string;
    status: string;
    items: unknown[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }
        const data = await response.json();
        setOrder(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : 'Failed to fetch order'
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchOrder();
    }
  }, [params.id, router, status]);

  if (status === 'loading' || isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-red-500'>Error</h1>
          <p className='mt-2 text-gray-600'>{error}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold'>Order Not Found</h1>
          <p className='mt-2 text-gray-600'>
            The order you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8'>
      <div className='max-w-2xl mx-auto'>
        <h1 className='text-3xl font-bold mb-8'>Order Details</h1>
        <OrderStatus order={order as any} />
      </div>
    </div>
  );
}
