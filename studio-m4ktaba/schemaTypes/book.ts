import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'book',
  title: 'Book',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(1).max(100),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
      validation: (Rule) => Rule.required().min(1).max(50),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: (Rule) => Rule.required().min(10).max(1000),
    }),
    defineField({
      name: 'selectedCondition',
      title: 'Condition',
      type: 'string',
      options: {
        list: [
          {title: 'New', value: 'new'},
          {title: 'Like New', value: 'like-new'},
          {title: 'Good', value: 'good'},
          {title: 'Fair', value: 'fair'},
          {title: 'Poor', value: 'poor'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'photos',
      title: 'Photos',
      type: 'array',
      of: [{type: 'image'}],
      validation: (Rule) => Rule.required().min(1).error('At least one photo is required.'),
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: (Rule) =>
        Rule.required().min(0).error('Price must be a positive value or free (0).'),
    }),
    defineField({
      name: 'quantity',
      title: 'Quantity',
      type: 'number',
      validation: (Rule) => Rule.required().min(0).error('Quantity must be at least (1).'),
    }),
    {
      name: 'selectedCategory',
      type: 'reference', // If referencing a category document
      title: 'Selected Category',
      to: [{ type: 'category' }], // Ensure 'category' matches the type of your category documents
      validation: (Rule) => Rule.required(),
    },
    defineField({
      name: 'user',
      title: 'Created By',
      type: 'reference',
      to: [{type: 'user'}],
      validation: (Rule) => Rule.required(),
    }),
  ],
})
