import { defineType } from 'sanity';

export const listing = defineType({
  name: 'listing',
  title: 'Listing',
  type: 'document',
  fields: [
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Draft', value: 'DRAFT' },
          { title: 'Published', value: 'PUBLISHED' },
          { title: 'Archived', value: 'ARCHIVED' },
        ],
        layout: 'radio',
      },
      initialValue: 'DRAFT',
      validation: Rule => Rule.required(),
    },
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required().max(200),
    },
    {
      name: 'author',
      title: 'Author',
      type: 'string',
      validation: Rule => Rule.required().max(100),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      validation: Rule => Rule.required().min(10).max(1000),
    },
    {
      name: 'isbn',
      title: 'ISBN',
      type: 'string',
      validation: Rule => Rule.optional(),
    },
    {
      name: 'condition',
      title: 'Condition',
      type: 'string',
      options: {
        list: [
          { title: 'New', value: 'new' },
          { title: 'Like New', value: 'like-new' },
          { title: 'Good', value: 'good' },
          { title: 'Fair', value: 'fair' },
          { title: 'Poor', value: 'poor' },
        ],
        layout: 'radio',
      },
      validation: Rule => Rule.required(),
    },
    {
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: Rule => Rule.required().min(0.01).max(10000),
    },
    {
      name: 'currency',
      title: 'Currency',
      type: 'string',
      options: {
        list: [
          { title: 'USD', value: 'USD' },
          { title: 'EUR', value: 'EUR' },
          { title: 'GBP', value: 'GBP' },
        ],
        layout: 'radio',
      },
      initialValue: 'USD',
      validation: Rule => Rule.required(),
    },
    {
      name: 'quantity',
      title: 'Quantity',
      type: 'number',
      initialValue: 1,
      validation: Rule => Rule.required().min(1).max(100),
    },
    {
      name: 'language',
      title: 'Language',
      type: 'string',
      options: {
        list: [
          { title: 'Arabic', value: 'Arabic' },
          { title: 'English', value: 'English' },
          { title: 'Urdu', value: 'Urdu' },
          { title: 'Turkish', value: 'Turkish' },
          { title: 'Other', value: 'Other' },
        ],
      },
      validation: Rule => Rule.required(),
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Quran & Tafseer', value: 'Quran' },
          { title: 'Hadith & Sunnah', value: 'Hadith' },
          { title: 'Fiqh & Jurisprudence', value: 'Fiqh' },
          { title: 'Aqeedah & Creed', value: 'Aqeedah' },
          { title: 'Seerah & History', value: 'Seerah' },
          { title: 'Tasawwuf & Spirituality', value: 'Tasawwuf' },
          { title: 'Arabic Language', value: 'Arabic' },
          { title: 'Other', value: 'Other' },
        ],
      },
      validation: Rule => Rule.required(),
    },
    {
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'alt',
              title: 'Alt Text',
              type: 'string',
            },
            {
              name: 'order',
              title: 'Order',
              type: 'number',
            },
          ],
        },
      ],
      validation: Rule => Rule.required().min(1).max(10),
    },
    {
      name: 'sellerId',
      title: 'Seller ID',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'qualityScore',
      title: 'Quality Score',
      type: 'number',
      readOnly: true,
      validation: Rule => Rule.min(0).max(100),
    },
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    },
    {
      name: 'updatedAt',
      title: 'Updated At',
      type: 'datetime',
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    },
    {
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      readOnly: true,
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'author',
      media: 'images.0.asset',
    },
    prepare(selection) {
      const { title, subtitle, media } = selection;
      return {
        title: title || 'Untitled',
        subtitle: subtitle || 'No author',
        media: media || undefined,
      };
    },
  },
});
