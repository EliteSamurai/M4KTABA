'use client';
import { useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

async function api(path: string, body?: unknown) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export default function QueuesAdmin() {
  const [outbox, setOutbox] = useState<unknown[]>([]);
  const [dlq, setDlq] = useState<unknown[]>([]);
  const [stripe, setStripe] = useState<unknown[]>([]);
  const [pending, start] = useTransition();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const router = useRouter();

  const reload = async () => {
    const [o, d, s] = await Promise.all([
      fetch('/api/queues/outbox').then(r => r.json()),
      fetch('/api/queues/dlq').then(r => r.json()),
      fetch('/api/queues/stripe').then(r => r.json()),
    ]);
    setOutbox(o.items || []);
    setDlq(d.items || []);
    setStripe(s.items || []);
  };

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      reload();
      router.refresh();
    }, 5000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  return (
    <div className='container mx-auto py-8 space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='text-sm text-muted-foreground'>
          queued: {outbox.length} • dlq: {dlq.length} • stripe:{' '}
          {(stripe as any).length}
        </div>
        <label className='flex items-center gap-2 text-sm'>
          <input
            type='checkbox'
            checked={autoRefresh}
            onChange={e => setAutoRefresh(e.target.checked)}
          />
          Auto refresh (5s)
        </label>
      </div>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle>Outbox ({outbox.length})</CardTitle>
            <Button
              variant='outline'
              size='sm'
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await api('/api/queues/outbox/retry');
                  await reload();
                })
              }
            >
              Retry All
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-2'>
          {outbox.map((x: any) => (
            <div
              key={x._id}
              className='flex items-center justify-between gap-4'
            >
              <div className='text-sm text-muted-foreground truncate'>
                {x.type} • {x._id}
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      await api('/api/queues/outbox/retry', { id: x._id });
                      await reload();
                    })
                  }
                >
                  Retry now
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle>DLQ ({dlq.length})</CardTitle>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    await api('/api/queues/dlq/requeue');
                    await reload();
                  })
                }
              >
                Requeue All
              </Button>
              <Button
                variant='destructive'
                size='sm'
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    await api('/api/queues/dlq/purge');
                    await reload();
                  })
                }
              >
                Purge All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-2'>
          {dlq.map((x: any) => (
            <div
              key={x._id}
              className='flex items-center justify-between gap-4'
            >
              <div className='text-sm text-muted-foreground truncate'>
                {x.queue} • {x._id}
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      await api('/api/queues/dlq/requeue', { id: x._id });
                      await reload();
                    })
                  }
                >
                  Requeue
                </Button>
                <Button
                  variant='destructive'
                  size='sm'
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      await api('/api/queues/dlq/purge', { id: x._id });
                      await reload();
                    })
                  }
                >
                  Purge
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle>Stripe Events ({(stripe as any).length})</CardTitle>
            <Button
              variant='outline'
              size='sm'
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await api('/api/queues/stripe/retry');
                  await reload();
                })
              }
            >
              Retry All
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-2'>
          {(stripe as any).map((x: any) => (
            <div
              key={x._id}
              className='flex items-center justify-between gap-4'
            >
              <div className='text-sm text-muted-foreground truncate'>
                {x._id}
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      await api('/api/queues/stripe/retry', { id: x._id });
                      await reload();
                    })
                  }
                >
                  Retry now
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
