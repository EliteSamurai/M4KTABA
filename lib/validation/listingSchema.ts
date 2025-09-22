import { z } from 'zod';

export const listingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  author: z
    .string()
    .min(1, 'Author is required')
    .max(100, 'Author name too long'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description too long'),
  price: z
    .number()
    .min(0.01, 'Price must be greater than 0')
    .max(10000, 'Price too high'),
  condition: z.string().min(1, 'Please select a condition'),
  quantity: z
    .number()
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Quantity too high'),
  isbn: z.string().optional(),
  language: z.string().min(1, 'Language is required'),
  category: z.string().min(1, 'Category is required'),
  currency: z.string().default('USD'),
  images: z
    .array(z.string())
    .min(1, 'At least one image is required')
    .max(10, 'Maximum 10 images allowed'),
});

export const listingCreateSchema = listingSchema.extend({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  sellerId: z.string().min(1, 'Seller ID is required'),
});

export const listingUpdateSchema = listingSchema.partial().extend({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  updatedAt: z.string().optional(),
});

export const listingPublishSchema = listingSchema.extend({
  images: z.array(z.string()).min(1, 'At least one image is required'),
});

export type ListingFormData = z.infer<typeof listingSchema>;
export type ListingCreateData = z.infer<typeof listingCreateSchema>;
export type ListingUpdateData = z.infer<typeof listingUpdateSchema>;
export type ListingPublishData = z.infer<typeof listingPublishSchema>;
