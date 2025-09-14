'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Clock,
  CheckCircle,
  XCircle,
  ArrowRightLeft,
  DollarSign,
  Calendar,
  User,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';

interface Offer {
  _id: string;
  _createdAt: string;
  amount: number;
  status: 'pending' | 'accepted' | 'declined' | 'countered' | 'completed';
  book: {
    _id: string;
    title: string;
    photos: { url: string }[];
  };
  buyer: {
    _id: string;
    email: string;
    name?: string;
  };
}

interface OfferListProps {
  offers: Offer[];
}

export default function OfferList({ offers }: OfferListProps) {
  const { toast } = useToast();
  const [counterAmount, setCounterAmount] = useState<{ [key: string]: string }>(
    {}
  );
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});

  const handleOfferAction = async (offerId: string, action: string) => {
    setIsLoading(prev => ({ ...prev, [offerId]: true }));
    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          ...(action === 'counter' && {
            counterAmount: Number(counterAmount[offerId]),
          }),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process offer');
      }

      const actionMessages = {
        accept: 'accepted',
        decline: 'declined',
        counter: 'counter offer sent',
      };

      toast({
        title: 'Success!',
        description: `Offer ${actionMessages[action as keyof typeof actionMessages]} successfully`,
      });

      // Refresh the page to show updated offers
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to process offer',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(prev => ({ ...prev, [offerId]: false }));
    }
  };

  const getStatusConfig = (status: Offer['status']) => {
    switch (status) {
      case 'pending':
        return {
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: Clock,
          label: 'Pending',
        };
      case 'accepted':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          label: 'Accepted',
        };
      case 'declined':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircle,
          label: 'Declined',
        };
      case 'countered':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: ArrowRightLeft,
          label: 'Countered',
        };
      case 'completed':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: CheckCircle,
          label: 'Completed',
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Clock,
          label: 'Unknown',
        };
    }
  };

  if (offers.length === 0) {
    return (
      <Card className='text-center py-12'>
        <CardContent>
          <div className='flex flex-col items-center space-y-4'>
            <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center'>
              <DollarSign className='w-8 h-8 text-gray-400' />
            </div>
            <div>
              <h3 className='text-lg font-semibold text-gray-900'>
                No offers yet
              </h3>
              <p className='text-gray-500 mt-1'>
                When buyers make offers on your books, they'll appear here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      {offers.map(offer => {
        const statusConfig = getStatusConfig(offer.status);
        const StatusIcon = statusConfig.icon;

        return (
          <Card
            key={offer._id}
            className='overflow-hidden hover:shadow-md transition-shadow'
          >
            <CardHeader className='pb-4'>
              <div className='flex items-start justify-between'>
                <div className='flex items-center space-x-3'>
                  <Avatar className='w-10 h-10'>
                    <AvatarFallback className='bg-blue-100 text-blue-600'>
                      {offer.buyer.name?.charAt(0) ||
                        offer.buyer.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='font-medium text-gray-900'>
                      {offer.buyer.name || 'Anonymous Buyer'}
                    </p>
                    <p className='text-sm text-gray-500 flex items-center'>
                      <User className='w-3 h-3 mr-1' />
                      {offer.buyer.email}
                    </p>
                  </div>
                </div>
                <Badge
                  variant='outline'
                  className={`${statusConfig.color} border`}
                >
                  <StatusIcon className='w-3 h-3 mr-1' />
                  {statusConfig.label}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className='space-y-4'>
              <div className='flex items-start space-x-4'>
                {offer.book.photos?.[0]?.url && (
                  <div className='relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden'>
                    <Image
                      src={offer.book.photos[0].url || '/placeholder.svg'}
                      alt={offer.book.title}
                      fill
                      className='object-cover'
                    />
                  </div>
                )}
                <div className='flex-1 min-w-0'>
                  <h3 className='font-semibold text-gray-900 truncate'>
                    {offer.book.title}
                  </h3>
                  <div className='flex items-center space-x-4 mt-2 text-sm text-gray-500'>
                    <div className='flex items-center'>
                      <DollarSign className='w-4 h-4 mr-1' />
                      <span className='font-medium text-lg text-gray-900'>
                        ${offer.amount}
                      </span>
                    </div>
                    <div className='flex items-center'>
                      <Calendar className='w-4 h-4 mr-1' />
                      {new Date(offer._createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {offer.status === 'pending' && (
                <>
                  <Separator />
                  <div className='space-y-3'>
                    <div className='flex flex-wrap gap-2'>
                      <Button
                        onClick={() => handleOfferAction(offer._id, 'accept')}
                        disabled={isLoading[offer._id]}
                        className='bg-green-600 hover:bg-green-700 text-white'
                        size='sm'
                      >
                        {isLoading[offer._id] ? (
                          <Loader2 className='w-4 h-4 animate-spin mr-2' />
                        ) : (
                          <CheckCircle className='w-4 h-4 mr-2' />
                        )}
                        Accept Offer
                      </Button>
                      <Button
                        onClick={() => handleOfferAction(offer._id, 'decline')}
                        disabled={isLoading[offer._id]}
                        variant='destructive'
                        size='sm'
                      >
                        {isLoading[offer._id] ? (
                          <Loader2 className='w-4 h-4 animate-spin mr-2' />
                        ) : (
                          <XCircle className='w-4 h-4 mr-2' />
                        )}
                        Decline
                      </Button>
                    </div>

                    <div className='flex items-center space-x-2 pt-2 border-t'>
                      <Input
                        type='number'
                        placeholder='Counter offer amount'
                        value={counterAmount[offer._id] || ''}
                        onChange={e =>
                          setCounterAmount(prev => ({
                            ...prev,
                            [offer._id]: e.target.value,
                          }))
                        }
                        className='flex-1 max-w-xs'
                        min='0'
                        step='0.01'
                      />
                      <Button
                        onClick={() => handleOfferAction(offer._id, 'counter')}
                        disabled={
                          isLoading[offer._id] || !counterAmount[offer._id]
                        }
                        variant='outline'
                        size='sm'
                      >
                        {isLoading[offer._id] ? (
                          <Loader2 className='w-4 h-4 animate-spin mr-2' />
                        ) : (
                          <ArrowRightLeft className='w-4 h-4 mr-2' />
                        )}
                        Counter Offer
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
