import { format } from 'date-fns';
import { DollarSign } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Payout } from '@/types/stripe';

interface PayoutsListProps {
  payouts: Payout[];
}

export function PayoutsList({ payouts }: PayoutsListProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusColor = (status: Payout['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Payouts</CardTitle>
        <CardDescription>
          Your latest payouts to your bank account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-8'>
          {payouts.map(payout => (
            <div key={payout.id} className='flex items-center'>
              <div className='flex h-9 w-9 items-center justify-center rounded-full bg-primary/10'>
                <DollarSign className='h-4 w-4 text-primary' />
              </div>
              <div className='ml-4 space-y-1'>
                <p className='text-sm font-medium leading-none'>
                  {formatCurrency(payout.amount, payout.currency)}
                </p>
                <p className='text-sm text-muted-foreground'>
                  {format(payout.arrival_date * 1000, 'MMM d, yyyy')}
                </p>
              </div>
              <div className='ml-auto'>
                <Badge className={getStatusColor(payout.status)}>
                  {payout.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
