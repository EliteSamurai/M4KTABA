/**
 * Shared order-ownership authorization for order-facing surfaces.
 *
 * Single source of truth for "can this user view this order / which side are
 * they on" — used by GET /api/orders/[orderId], the app/orders/[id] page, and
 * GET /api/orders/[orderId]/tracking. Keeping it in one place prevents the
 * buy-vs-sell access logic from silently drifting across copies.
 */
export type OrderAccess = 'buyer' | 'seller' | null;

export function getOrderAccess(
  order: {
    userEmail?: string | null;
    cart?: Array<{
      user?: { _id?: string | null; email?: string | null } | null;
    }> | null;
  },
  user: { email?: string | null; _id?: string | null; id?: string | null } | null | undefined
): OrderAccess {
  if (!user?.email) return null;
  if (order.userEmail === user.email) return 'buyer';

  const userId = user._id ?? user.id;
  const isSeller = (order.cart || []).some(
    (item) =>
      item?.user?._id === userId || item?.user?.email === user.email
  );
  return isSeller ? 'seller' : null;
}
