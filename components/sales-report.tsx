'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface SalesReportProps {
  launched: number;
  ongoing: number;
  sold: number;
}

export function SalesReport({ launched, ongoing, sold }: SalesReportProps) {
  const max = Math.max(launched, ongoing, sold);

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>Sales Report</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <div className='text-sm'>Product Launched</div>
              <div className='text-sm text-muted-foreground'>({launched})</div>
            </div>
            <Progress value={(launched / max) * 100} className='h-2' />
          </div>
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <div className='text-sm'>Ongoing Product</div>
              <div className='text-sm text-muted-foreground'>({ongoing})</div>
            </div>
            <Progress value={(ongoing / max) * 100} className='h-2' />
          </div>
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <div className='text-sm'>Product Sold</div>
              <div className='text-sm text-muted-foreground'>({sold})</div>
            </div>
            <Progress value={(sold / max) * 100} className='h-2' />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
