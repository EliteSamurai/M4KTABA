'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { getFlag, getNumberFlag } from '@/lib/flags';

export default function FlagsAdmin() {
  const { data: session } = useSession();
  const [enabled, setEnabled] = useState<boolean>(
    getFlag('CHECKOUT_V2_ENABLED', false)
  );
  const [percent, setPercent] = useState<number>(
    getNumberFlag('CHECKOUT_V2_PERCENT', 0)
  );

  useEffect(() => {
    // Warn if no DB backend, env-only flags
    console.warn(
      'Flags admin is running in env-backed mode. Changes here are not persisted.'
    );
  }, []);

  if (!session) return null;
  // TODO: protect with role check in real system

  return (
    <div className='container mx-auto py-8'>
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center gap-4'>
            <label className='w-48'>Checkout v2 enabled</label>
            <Input
              value={enabled ? 'true' : 'false'}
              onChange={e => setEnabled(e.target.value === 'true')}
            />
          </div>
          <div className='flex items-center gap-4'>
            <label className='w-48'>Checkout v2 percent</label>
            <Input
              type='number'
              value={percent}
              onChange={e => setPercent(Number(e.target.value) || 0)}
            />
          </div>
          <Button
            type='button'
            onClick={() => alert('Persist to DB not implemented')}
          >
            Save
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
