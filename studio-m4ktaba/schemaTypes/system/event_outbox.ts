import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'event_outbox',
  title: 'Event Outbox',
  type: 'document',
  fields: [
    defineField({
      name: 'type',
      type: 'string',
      title: 'Type',
      validation: (r: any) => r.required(),
    }),
    defineField({name: 'payload', type: 'text', title: 'Payload'}),
    defineField({
      name: 'created_at',
      type: 'datetime',
      title: 'Created At',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({name: 'processed_at', type: 'datetime', title: 'Processed At'}),
    defineField({name: 'attempts', type: 'number', title: 'Attempts', initialValue: 0}),
    defineField({name: 'key', type: 'string', title: 'Idempotency Key'}),
    defineField({name: 'orderId', type: 'string', title: 'Order ID'}),
  ],
  preview: {
    select: {title: 'type', subtitle: 'created_at'},
  },
})
