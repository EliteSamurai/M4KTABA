import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'order',
  title: 'Order',
  type: 'document',
  fields: [
    defineField({
      name: 'status',
      title: 'Order Status',
      type: 'string',
      options: {
        list: [
          {title: 'Pending', value: 'pending'},
          {title: 'Completed', value: 'completed'},
          {title: 'Cancelled', value: 'cancelled'},
        ],
      },
    }),
    defineField({
      name: 'paymentId',
      title: 'Payment ID',
      type: 'string',
    }),
    defineField({
      name: 'cart',
      title: 'Cart Items',
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
            {
              name: 'shippingStatus',
              title: 'Shipping Status',
              type: 'string',
              options: {
                list: [
                  { title: 'Pending', value: 'pending' },
                  { title: 'Shipped', value: 'shipped' },
                  { title: 'Delivered', value: 'delivered' },
                  { title: 'Cancelled', value: 'cancelled' },
                ],
              },
            },
            {
              name: 'user',
              type: 'object',
              title: 'User',
              fields: [
                {name: 'userId', type: 'string', title: 'User ID'},
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

            {
              name: 'refundDetails',
              title: 'Refund Details',
              type: 'object',
              fields: [
                {
                  name: 'refundStatus',
                  title: 'Refund Status',
                  type: 'string',
                  options: {
                    list: [
                      {title: 'Not Requested', value: 'not_requested'},
                      {title: 'Requested', value: 'requested'},
                      {title: 'Processing', value: 'processing'},
                      {title: 'Completed', value: 'completed'},
                      {title: 'Failed', value: 'failed'},
                    ],
                  },
                },
                {
                  name: 'refundReason',
                  title: 'Refund Reason',
                  type: 'string',
                },
                {
                  name: 'refundAmount',
                  title: 'Refund Amount',
                  type: 'number',
                },
                {
                  name: 'refundDate',
                  title: 'Refund Date',
                  type: 'datetime',
                },
              ],
            },
          ],
        },
      ],
    }),
  ],
})
