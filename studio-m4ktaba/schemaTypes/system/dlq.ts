import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'dlq',
  title: 'Dead Letter Queue',
  type: 'document',
  fields: [
    defineField({
      name: 'queue',
      type: 'string',
      title: 'Queue',
      validation: (r: any) => r.required(),
    }),
    defineField({name: 'payload', type: 'text', title: 'Payload'}),
    defineField({name: 'reason', type: 'string', title: 'Reason'}),
    defineField({
      name: 'created_at',
      type: 'datetime',
      title: 'Created At',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({name: 'attempts', type: 'number', title: 'Attempts', initialValue: 0}),
    defineField({name: 'last_error', type: 'string', title: 'Last Error'}),
  ],
  preview: {
    select: {title: 'queue', subtitle: 'reason'},
  },
})
