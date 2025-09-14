import { CartItem } from '@/types/shipping-types';

export async function prefetchCheckoutData(cart: CartItem[]) {
  try {
    // Warm up address validator module
    await import('@/app/checkout/address-validator');
  } catch {}
  try {
    // Optionally prefetch related books/recommendations based on first item
    const first = cart && cart[0];
    if (first) {
      const qs = new URLSearchParams({
        bookId: first.id,
        categoryId: (first as { categoryId?: string }).categoryId || '',
      });
      fetch(`/api/related-books?${qs.toString()}`).catch(() => {});
    }
  } catch {}
}
