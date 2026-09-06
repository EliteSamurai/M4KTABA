import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'review',
  title: 'Review',
  type: 'document',
  fields: [
    // Primary subject: the seller being reviewed (matches the existing
    // billing -> /api/sellers/[sellerId]/reviews -> seller profile flow).
    defineField({
      name: 'seller',
      title: 'Seller',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
    }),
    // Reviewer is always captured server-side from the session, never from
    // the client (the previous route trusted a bare {score, review} POST).
    defineField({
      name: 'reviewer',
      title: 'Reviewer',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
    }),
    // Optional proof-of-purchase + context. `order` is used by the purchase
    // gate; `book` is optional book context (seller-first in v1).
    defineField({
      name: 'order',
      title: 'Order',
      type: 'reference',
      to: [{ type: 'order' }],
    }),
    defineField({
      name: 'book',
      title: 'Book',
      type: 'reference',
      to: [{ type: 'book' }],
    }),
    defineField({
      name: 'score',
      title: 'Score',
      type: 'number',
      validation: (Rule) => Rule.required().min(1).max(5),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'body',
      title: 'Review',
      type: 'text',
      validation: (Rule) => Rule.max(1000),
    }),
    // Moderation gate (Phase 4). New reviews auto-approve in v1 via the write
    // route (status set to 'approved' at creation); this defaultValue stays
    // 'draft' so manual Studio edits are safe until moderation ships.
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Approved', value: 'approved' },
          { title: 'Reported', value: 'reported' },
        ],
      },
      initialValue: 'draft',
      description:
        'draft = awaiting moderation | approved = visible publicly | reported = flagged for review',
    }),
    // Functional from day one (v1): a signed-in user can append their _id
    // here to flag a review. Studio shows it immediately as a manual lever
    // before Phase 4 formalizes the moderation workflow.
    defineField({
      name: 'reportedBy',
      title: 'Reporters',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'user' }] }],
    }),
    defineField({
      name: 'createdAt',
      title: 'Created',
      type: 'datetime',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published',
      type: 'datetime',
    }),
  ],
  preview: {
    select: { title: 'seller.email', score: 'score' },
    prepare({ title, score }) {
      return {
        title: title || 'Review',
        subtitle: `Rating: ${score ?? 0}/5`,
      }
    },
  },
})
