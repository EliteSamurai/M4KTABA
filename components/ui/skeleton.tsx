import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden='true'
      className={cn(
        'relative overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800',
        className
      )}
      {...props}
    >
      <div className='pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/10' />
      <style suppressHydrationWarning>
        {`@keyframes shimmer{100%{transform:translateX(100%)}}`}
      </style>
    </div>
  );
}

export { Skeleton };
