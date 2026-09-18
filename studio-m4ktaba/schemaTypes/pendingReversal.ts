import {defineField, defineType} from 'sanity'

/**
 * pendingReversal — a transfer reversal that needs a human to approve.
 *
 * Created by the Stripe webhook when a refund (charge.refunded) or a lost
 * dispute (charge.dispute.closed, outcome 'lost') affects a per-seller
 * transfer. The webhook NEVER reverses automatically (decision B); it only
 * flags. An admin approves via POST /api/admin/pending-reversals/[id] which
 * executes createTransferReversal.
 */
export default defineType({
  name: 'pendingReversal',
  title: 'Pending Reversal',
  type: 'document',
  fields: [
    defineField({
      name: 'paymentId',
      title: 'Payment ID',
      type: 'string',
      description: 'Stripe PaymentIntent id the source charge belongs to',
    }),
    defineField({
      name: 'transferId',
      title: 'Transfer ID',
      type: 'string',
      description: 'Stripe Transfer (tr_...) to reverse',
    }),
    defineField({
      name: 'amountCents',
      title: 'Amount (cents)',
      type: 'number',
      description: 'Portion of the transfer to reverse on approval',
    }),
    defineField({
      name: 'currency',
      title: 'Currency',
      type: 'string',
      initialValue: 'usd',
    }),
    defineField({
      name: 'sellerOrderId',
      title: 'Seller Order ID',
      type: 'string',
      description: 'Sanity _id of the affected orderKind:"seller" order',
    }),
    defineField({
      name: 'buyerOrderId',
      title: 'Buyer Order ID',
      type: 'string',
      description: 'Sanity _id of the affected orderKind:"buyer" order',
    }),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      options: {
        list: [
          {title: 'Refund', value: 'refund'},
          {title: 'Dispute', value: 'dispute'},
        ],
      },
    }),
    defineField({
      name: 'reason',
      title: 'Reason',
      type: 'string',
      description: 'Refund id / dispute id + outcome (human readable)',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Pending', value: 'pending'},
          {title: 'Approved', value: 'approved'},
          {title: 'Rejected', value: 'rejected'},
          {title: 'Executed', value: 'executed'},
          {title: 'Failed', value: 'failed'},
        ],
      },
    }),
    defineField({
      name: 'executedTransferId',
      title: 'Reversal ID',
      type: 'string',
      description: 'Stripe reversal (trr_...) id once executed',
    }),
    defineField({
      name: 'error',
      title: 'Error',
      type: 'string',
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
    }),
    defineField({
      name: 'reviewedAt',
      title: 'Reviewed At',
      type: 'datetime',
    }),
    defineField({
      name: 'executedAt',
      title: 'Executed At',
      type: 'datetime',
    }),
  ],
})
