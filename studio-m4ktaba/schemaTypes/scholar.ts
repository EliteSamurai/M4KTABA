import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'scholar',
  title: 'Scholar',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'bio',
      title: 'Biography',
      type: 'text',
    }),
    defineField({
      name: 'deathHijri',
      title: 'Date of Death (Hijri)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
  ],
})
