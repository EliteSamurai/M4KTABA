import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'user',
  title: 'User',
  type: 'document',
  fields: [
    defineField({
      name: 'email',
      title: 'Email Address',
      type: 'email',
      validation: (Rule) =>
        Rule.custom((email, context) => {
          if (!email && !context.document?.username) {
            return 'Email is required.'
          }
          return true
        }),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'object',
      fields: [
        {name: 'street', title: 'Street', type: 'string'},
        {name: 'city', title: 'City', type: 'string'},
        {name: 'state', title: 'State', type: 'string'},
        {name: 'zip', title: 'Zip Code', type: 'string'},
        {name: 'country', title: 'Country', type: 'string'},
      ],
      description: "The user's complete address.",
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'array',
      of: [
        {
          title: 'Block',
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [],
        },
      ],
    }),
    defineField({
      name: 'password',
      title: 'Password',
      type: 'string',
      hidden: true, // Make it hidden in the Sanity studio for security reasons
    }),
    {
      name: 'stripeAccountId',
      title: 'Stripe Account ID',
      type: 'string',
      description: 'The ID of the Stripe account associated with this user.',
    },
    defineField({
      name: 'profileComplete',
      title: 'Profile Complete',
      type: 'boolean',
      description: 'Indicates whether the user has completed their profile (address, etc.)',
      initialValue: false,
    }),
    defineField({
      name: 'ratings',
      title: 'Ratings',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'rating',
          fields: [
            defineField({
              name: 'score',
              title: 'Score',
              type: 'number',
              validation: (Rule) =>
                Rule.required().min(1).max(5).error('Rating must be between 1 and 5.'),
            }),
            defineField({
              name: 'review',
              title: 'Review',
              type: 'string',
              description: 'Optional review message.',
              validation: (Rule) => Rule.max(500).warning('Keep reviews under 500 characters.'),
            }),
          ],
          preview: {
            select: {
              score: 'score',
              review: 'review',
            },
            prepare({score, review}) {
              return {
                title: `Rating: ${score}/5`,
                subtitle: review || 'No review provided',
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'cart',
      title: 'Cart',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'cartItem',
          fields: [
            {name: 'id', type: 'string', title: 'Product ID'},
            {name: 'title', type: 'string', title: 'Product Title'},
            {name: 'quantity', type: 'number', title: 'Quantity'},
            {name: 'price', type: 'number', title: 'Price'},
            defineField({
              name: 'order',
              title: 'Order',
              type: 'reference',
              to: [{type: 'order'}],
            }),
            {
              name: 'user',
              type: 'object',
              title: 'User',
              fields: [
                {name: 'email', type: 'string', title: 'Email'},
                {
                  name: 'location',
                  type: 'object',
                  title: 'Location',
                  fields: [
                    {name: 'street', type: 'string', title: 'Street'},
                    {name: 'city', type: 'string', title: 'City'},
                    {name: 'state', type: 'string', title: 'State'},
                    {name: 'zip', type: 'string', title: 'ZIP Code'},
                    {name: 'country', type: 'string', title: 'Country'},
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'orderHistory',
      title: 'Order History',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'order'}], // Reference to the order document type
        },
      ],
      description: 'Past orders that the user has completed.',
    }),
  ],

  preview: {
    select: {
      title: 'email',
      media: 'image',
    },
  },
})
