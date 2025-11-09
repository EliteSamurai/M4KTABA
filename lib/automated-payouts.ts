/**
 * Automated Payout System
 * Handles seller payouts, ledger tracking, and reconciliation
 */

export interface PayoutRecord {
  id: string;
  sellerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  method: 'stripe' | 'paypal' | 'bank_transfer';
  stripePayoutId?: string;
  paypalBatchId?: string;
  transactions: string[]; // Transaction IDs included in payout
  createdAt: Date;
  scheduledAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  retryCount: number;
}

export interface LedgerEntry {
  id: string;
  sellerId: string;
  type: 'sale' | 'refund' | 'payout' | 'fee' | 'adjustment';
  amount: number;
  currency: string;
  orderId?: string;
  payoutId?: string;
  description: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface SellerBalance {
  sellerId: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  totalPayouts: number;
  currency: string;
  lastPayoutDate?: Date;
  nextPayoutDate?: Date;
}

/**
 * Calculate seller balance from ledger entries
 */
export function calculateSellerBalance(
  entries: LedgerEntry[]
): SellerBalance {
  let availableBalance = 0;
  let pendingBalance = 0;
  let totalEarnings = 0;
  let totalPayouts = 0;

  entries.forEach((entry) => {
    switch (entry.type) {
      case 'sale':
        // Sales are available after 7 days (holding period)
        const daysSinceSale =
          (Date.now() - entry.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceSale >= 7) {
          availableBalance += entry.amount;
        } else {
          pendingBalance += entry.amount;
        }
        totalEarnings += entry.amount;
        break;

      case 'refund':
        availableBalance -= entry.amount;
        totalEarnings -= entry.amount;
        break;

      case 'payout':
        availableBalance -= entry.amount;
        totalPayouts += entry.amount;
        break;

      case 'fee':
        availableBalance -= entry.amount;
        break;

      case 'adjustment':
        availableBalance += entry.amount;
        break;
    }
  });

  // Get seller ID and currency from first entry
  const sellerId = entries[0]?.sellerId || '';
  const currency = entries[0]?.currency || 'USD';

  return {
    sellerId,
    availableBalance: Math.max(0, availableBalance),
    pendingBalance: Math.max(0, pendingBalance),
    totalEarnings,
    totalPayouts,
    currency,
  };
}

/**
 * Create payout schedule
 */
export interface PayoutSchedule {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  minimumAmount: number;
  autoPayoutEnabled: boolean;
}

export function getNextPayoutDate(schedule: PayoutSchedule): Date {
  const now = new Date();

  switch (schedule.frequency) {
    case 'daily':
      // Next day at 9 AM
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow;

    case 'weekly':
      // Next occurrence of specified day
      const daysUntilNext =
        ((schedule.dayOfWeek || 1) - now.getDay() + 7) % 7 || 7;
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + daysUntilNext);
      nextWeek.setHours(9, 0, 0, 0);
      return nextWeek;

    case 'biweekly':
      // Every 14 days
      const biweekly = new Date(now);
      biweekly.setDate(biweekly.getDate() + 14);
      biweekly.setHours(9, 0, 0, 0);
      return biweekly;

    case 'monthly':
      // Next occurrence of specified day of month
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(Math.min(schedule.dayOfMonth || 1, 28)); // Safe day
      nextMonth.setHours(9, 0, 0, 0);
      return nextMonth;

    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
  }
}

/**
 * Check if seller is eligible for payout
 */
export function isEligibleForPayout(
  balance: SellerBalance,
  schedule: PayoutSchedule
): boolean {
  // Check minimum amount
  if (balance.availableBalance < schedule.minimumAmount) {
    return false;
  }

  // Check if auto-payout is enabled
  if (!schedule.autoPayoutEnabled) {
    return false;
  }

  return true;
}

/**
 * Create payout for seller
 */
export async function createPayout(
  sellerId: string,
  amount: number,
  currency: string,
  transactions: string[],
  method: 'stripe' | 'paypal' = 'stripe'
): Promise<PayoutRecord> {
  const payout: PayoutRecord = {
    id: `payout_${Date.now()}_${sellerId}`,
    sellerId,
    amount,
    currency,
    status: 'pending',
    method,
    transactions,
    createdAt: new Date(),
    scheduledAt: new Date(),
    retryCount: 0,
  };

  // TODO: Save to database
  console.log('Creating payout:', payout);

  return payout;
}

/**
 * Process payout via Stripe
 */
export async function processStripePayout(
  payout: PayoutRecord,
  stripeAccountId: string
): Promise<PayoutRecord> {
  try {
    const { stripe } = await import('./stripe');

    // Create Stripe payout
    const stripePayout = await (stripe as any).payouts.create(
      {
        amount: Math.round(payout.amount * 100),
        currency: payout.currency.toLowerCase(),
        description: `M4KTABA Payout - ${payout.id}`,
        metadata: {
          payoutId: payout.id,
          sellerId: payout.sellerId,
          transactionCount: payout.transactions.length,
        },
      },
      {
        stripeAccount: stripeAccountId,
      }
    );

    payout.stripePayoutId = stripePayout.id;
    payout.status = 'processing';
    payout.processedAt = new Date();

    console.log('Stripe payout created:', stripePayout.id);

    return payout;
  } catch (error) {
    console.error('Stripe payout failed:', error);
    payout.status = 'failed';
    payout.failureReason = error instanceof Error ? error.message : 'Unknown error';
    return payout;
  }
}

/**
 * Process payout via PayPal
 */
export async function processPayPalPayout(
  payout: PayoutRecord,
  paypalEmail: string
): Promise<PayoutRecord> {
  try {
    const { getPayPalAccessToken } = await import('./paypal');
    const accessToken = await getPayPalAccessToken();

    const PAYPAL_API_BASE =
      process.env.NODE_ENV === 'production'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

    // Create PayPal batch payout
    const response = await fetch(`${PAYPAL_API_BASE}/v1/payments/payouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: payout.id,
          email_subject: 'M4KTABA Payout',
          email_message: `Your payout of ${payout.amount} ${payout.currency}`,
        },
        items: [
          {
            recipient_type: 'EMAIL',
            amount: {
              value: payout.amount.toFixed(2),
              currency: payout.currency,
            },
            receiver: paypalEmail,
            note: `M4KTABA Payout - ${payout.id}`,
            sender_item_id: payout.id,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`PayPal payout failed: ${await response.text()}`);
    }

    const result = await response.json();

    payout.paypalBatchId = result.batch_header.payout_batch_id;
    payout.status = 'processing';
    payout.processedAt = new Date();

    console.log('PayPal payout created:', result.batch_header.payout_batch_id);

    return payout;
  } catch (error) {
    console.error('PayPal payout failed:', error);
    payout.status = 'failed';
    payout.failureReason = error instanceof Error ? error.message : 'Unknown error';
    return payout;
  }
}

/**
 * Record ledger entry
 */
export async function recordLedgerEntry(
  entry: Omit<LedgerEntry, 'id' | 'createdAt'>
): Promise<LedgerEntry> {
  const ledgerEntry: LedgerEntry = {
    ...entry,
    id: `ledger_${Date.now()}_${entry.sellerId}`,
    createdAt: new Date(),
  };

  // TODO: Save to database
  console.log('Recording ledger entry:', ledgerEntry);

  return ledgerEntry;
}

/**
 * Reconcile payouts with ledger
 */
export async function reconcilePayouts(
  sellerId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  matched: number;
  unmatched: number;
  discrepancies: Array<{ type: string; description: string; amount: number }>;
}> {
  // TODO: Fetch payouts and ledger entries from database
  console.debug('Reconciling payouts (mock)', {
    sellerId,
    startDate,
    endDate,
  });

  const matched = 0;
  const unmatched = 0;
  const discrepancies: Array<{
    type: string;
    description: string;
    amount: number;
  }> = [];

  // Compare payouts with ledger entries
  // Flag any discrepancies

  return { matched, unmatched, discrepancies };
}

/**
 * Get payout statistics
 */
export interface PayoutStatistics {
  totalPayouts: number;
  totalAmount: number;
  averagePayoutAmount: number;
  successRate: number;
  averageProcessingTime: number; // hours
  pendingCount: number;
  pendingAmount: number;
  failedCount: number;
}

export async function getPayoutStatistics(
  sellerId: string,
  timeRange: 'week' | 'month' | 'year'
): Promise<PayoutStatistics> {
  // TODO: Fetch from database
  console.debug('Fetching payout statistics (mock)', { sellerId, timeRange });

  return {
    totalPayouts: 0,
    totalAmount: 0,
    averagePayoutAmount: 0,
    successRate: 100,
    averageProcessingTime: 24,
    pendingCount: 0,
    pendingAmount: 0,
    failedCount: 0,
  };
}

/**
 * Batch process payouts (cron job)
 */
export async function batchProcessPayouts(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  console.log('🔄 Starting batch payout processing...');

  // TODO: Fetch all sellers eligible for payout
  // const eligibleSellers = await fetchEligibleSellers();

  // Process each seller
  // for (const seller of eligibleSellers) {
  //   try {
  //     const payout = await createAndProcessPayout(seller);
  //     processed++;
  //     if (payout.status === 'processing') succeeded++;
  //     else failed++;
  //   } catch (error) {
  //     failed++;
  //   }
  // }

  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
  };

  console.log(
    `✅ Batch processing complete: ${results.processed} processed, ${results.succeeded} succeeded, ${results.failed} failed`
  );

  return results;
}

/**
 * Retry failed payout
 */
export async function retryPayout(
  payoutId: string,
  maxRetries = 3
): Promise<PayoutRecord | null> {
  // TODO: Fetch payout from database

  const payout = await Promise.resolve<PayoutRecord | null>(null);

  if (!payout || payout.retryCount >= maxRetries) {
    console.warn('No payout available for retry', { payoutId });
    return null;
  }

  const updated: PayoutRecord = {
    ...payout,
    retryCount: payout.retryCount + 1,
    status: 'pending',
  };

  // Retry processing
  // const updated = await processPayout(payout);

  return updated;
}

