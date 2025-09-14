/*
  Minimal stub to allow stripe-consumer to run cleanly until
  real order/ledger updates are implemented.
*/

export async function updateOrderFromStripeEvent(
  payload: unknown
): Promise<void> {
  try {
    const event = payload as {
      type?: string;
      data?: { object?: { id?: string; payment_intent?: string } };
    };
    const type: string = event?.type || 'unknown';
    const intentId: string | undefined =
      event?.data?.object?.id || event?.data?.object?.payment_intent;
    // Non-throwing no-op; just log for visibility in workers
    // Replace this with real order + ledger updates.
    // Example mapping to implement later:
    // - payment_intent.succeeded => mark order paid
    // - charge.refunded => mark order item refunded
    // - charge.dispute.created => flag dispute on order
    // - payout.paid => record seller payout
    // - etc.
    console.log('[payments] stub updateOrderFromStripeEvent', {
      type,
      intentId,
    });
  } catch {
    // swallow; worker retries are not needed for stub
  }
}
