import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownIcon, ArrowUpIcon, DollarSign } from 'lucide-react';

interface OverviewCardsProps {
  balance: {
    available: number;
    pending: number;
    currency: string;
  };
  volume: {
    current: number;
    previous: number;
    currency: string;
  };
}

export function OverviewCards({ balance, volume }: OverviewCardsProps) {
  // Handle cases where volume might be undefined or previous is 0
  const volumeChange =
    volume && volume.previous > 0
      ? ((volume.current - volume.previous) / volume.previous) * 100
      : 0;
  const isPositiveChange = volumeChange > 0;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Available Balance
          </CardTitle>
          <DollarSign className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {formatCurrency(balance.available, balance.currency)}
          </div>
          <p className='text-xs text-muted-foreground'>
            {formatCurrency(balance.pending, balance.currency)} pending
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Payment Volume</CardTitle>
          <DollarSign className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {volume ? formatCurrency(volume.current, volume.currency) : '$0.00'}
          </div>
          <p className='flex items-center text-xs text-muted-foreground'>
            {volume && volume.previous > 0 ? (
              <>
                {isPositiveChange ? (
                  <ArrowUpIcon className='mr-1 h-4 w-4 text-green-500' />
                ) : (
                  <ArrowDownIcon className='mr-1 h-4 w-4 text-red-500' />
                )}
                {Math.abs(volumeChange).toFixed(1)}% from last month
              </>
            ) : (
              'No previous data available'
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
