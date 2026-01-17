import { z } from 'zod';

export const CartItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  quantity: z.number().int().min(1),
  price: z.number().min(0),
  weight: z.number().optional(),
  user: z
    .object({
      _id: z.string().min(1).optional(),
      email: z.string().email().optional(),
      stripeAccountId: z.string().optional(),
      location: z
        .object({
          street: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zip: z.string().optional(),
          country: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export const CartMutationSchema = z.object({
  cart: z.string(),
});

export const ProfileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z.string().url().optional(),
  location: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
});

export const OrderCreateSchema = z.object({
  items: z.array(CartItemSchema).min(1),
  shippingDetails: z.object({
    name: z.string().min(1),
    street1: z.string().min(1),
    street2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
    country: z.string().min(1),
  }),
});

export const SearchQuerySchema = z.object({
  q: z.string().optional(),
  author: z.string().optional(),
  language: z.string().optional(),
  condition: z.string().optional(),
  price_min: z.coerce.number().optional(),
  price_max: z.coerce.number().optional(),
  sort: z.enum(['new', 'price_asc', 'price_desc']).optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(50).optional(),
});
