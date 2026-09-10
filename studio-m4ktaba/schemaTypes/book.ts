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
      to: [{type: 'category'}], // Ensure 'category' matches the type of your category documents
      validation: (Rule) => Rule.required(),
    },
    defineField({
      name: 'user',
      title: 'Created By',
      type: 'reference',
      to: [{type: 'user'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Draft', value: 'draft'},
          {title: 'Published', value: 'published'},
          {title: 'Sold Out', value: 'sold_out'},
          {title: 'Hidden', value: 'hidden'},
        ],
      },
      initialValue: 'published',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'views',
      title: 'Views',
      type: 'number',
      initialValue: 0,
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'viewedBy',
      title: 'Viewed By Users',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Array of user IDs who have viewed this book',
    }),
    defineField({
      name: 'sales',
      title: 'Sales Count',
      type: 'number',
      initialValue: 0,
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'revenue',
      title: 'Revenue',
      type: 'number',
      initialValue: 0,
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'isMainImageSet',
      title: 'Main Image Set',
      type: 'boolean',
      initialValue: false,
      description: 'Whether the seller has manually set a main image',
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      options: {
        list: [{title: 'Arabic', value: 'arabic'}],
      },
      initialValue: 'arabic',
      description: 'The language of the book text. Currently Arabic-only (site policy).',
    }),
    defineField({
      name: 'madhab',
      title: 'Madhab',
      type: 'string',
      options: {
        list: [
          {title: 'Hanafi', value: 'hanafi'},
          {title: 'Maliki', value: 'maliki'},
          {title: "Shafi'i", value: 'shafi-i'},
          {title: 'Hanbali', value: 'hanbali'},
        ],
      },
      description: 'School of jurisprudence. Relevant mainly for Fiqh books.',
    }),
    defineField({
      name: 'sellerType',
      title: 'Seller Type',
      type: 'string',
      options: {
        list: [
          {title: 'Independent Seller', value: 'marketplace'},
          {title: 'M4KTABA Direct (first-party)', value: 'first_party'},
        ],
      },
      initialValue: 'marketplace',
      description:
        'first_party = stock sold directly by M4KTABA (e.g. honey). marketplace = listed by an independent seller.',
    }),
    defineField({
      name: 'edition',
      title: 'Edition',
      type: 'string',
      description: 'e.g. "2nd Edition" or "Revised". Optional.',
    }),
    defineField({
      name: 'publisher',
      title: 'Publisher',
      type: 'string',
      description: 'Name of the publisher (optional).',
    }),
  ],
})
