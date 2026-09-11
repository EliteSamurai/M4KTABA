import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class names, resolving conflicts.
 * The standard shadcn/ui utility used across the codebase.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
