import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'stripe_events',
  title: 'Stripe Events',
  type: 'document',
  fields: [
    defineField({
      name: 'event_id',
      type: 'string',
      title: 'Event ID',
      validation: (r: any) => r.required(),
    }),
    defineField({name: 'payload', type: 'text', title: 'Payload'}),
    defineField({name: 'intent_id', type: 'string', title: 'Intent ID'}),
    defineField({
      name: 'created_at',
      type: 'datetime',
      title: 'Created At',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({name: 'processed_at', type: 'datetime', title: 'Processed At'}),
    defineField({name: 'attempts', type: 'number', title: 'Attempts', initialValue: 0}),
  ],
  preview: {
    select: {title: 'event_id', subtitle: 'intent_id'},
  },
})
