import {
  listingSchema,
  listingCreateSchema,
  listingUpdateSchema,
  listingPublishSchema,
} from '@/lib/validation/listingSchema';

describe('Listing Schema Validation', () => {
  describe('listingSchema', () => {
    const validListing = {
      title: 'Test Book',
      author: 'Test Author',
      description: 'This is a test book description that is long enough',
      price: 10.5,
      condition: 'good',
      quantity: 1,
      language: 'Arabic',
      category: 'Fiction',
      images: ['image1.jpg', 'image2.jpg'],
    };

    test('validates correct data', () => {
      const result = listingSchema.safeParse(validListing);
      expect(result.success).toBe(true);
    });

    test('fails validation for missing required fields', () => {
      const invalidListing = {
        title: '',
        author: 'Test Author',
        description: 'Short',
        price: 0,
        condition: '',
        quantity: 0,
        language: '',
        category: '',
        images: [],
      };

      const result = listingSchema.safeParse(invalidListing);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(8); // All required fields missing
      }
    });

    test('validates title length', () => {
      const longTitle = 'a'.repeat(201);
      const result = listingSchema.safeParse({
        ...validListing,
        title: longTitle,
      });
      expect(result.success).toBe(false);
    });

    test('validates author length', () => {
      const longAuthor = 'a'.repeat(101);
      const result = listingSchema.safeParse({
        ...validListing,
        author: longAuthor,
      });
      expect(result.success).toBe(false);
    });

    test('validates description length', () => {
      const shortDescription = 'Short';
      const result = listingSchema.safeParse({
        ...validListing,
        description: shortDescription,
      });
      expect(result.success).toBe(false);
    });

    test('validates price range', () => {
      const negativePrice = listingSchema.safeParse({
        ...validListing,
        price: -1,
      });
      expect(negativePrice.success).toBe(false);

      const highPrice = listingSchema.safeParse({
        ...validListing,
        price: 10001,
      });
      expect(highPrice.success).toBe(false);
    });

    test('validates quantity range', () => {
      const zeroQuantity = listingSchema.safeParse({
        ...validListing,
        quantity: 0,
      });
      expect(zeroQuantity.success).toBe(false);

      const highQuantity = listingSchema.safeParse({
        ...validListing,
        quantity: 101,
      });
      expect(highQuantity.success).toBe(false);
    });

    test('validates image count', () => {
      const noImages = listingSchema.safeParse({
        ...validListing,
        images: [],
      });
      expect(noImages.success).toBe(false);

      const tooManyImages = listingSchema.safeParse({
        ...validListing,
        images: Array(11).fill('image.jpg'),
      });
      expect(tooManyImages.success).toBe(false);
    });

    test('allows optional ISBN', () => {
      const result = listingSchema.safeParse({
        ...validListing,
        isbn: '978-0-123456-78-9',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('listingCreateSchema', () => {
    test('includes status and sellerId', () => {
      const validCreateData = {
        title: 'Test Book',
        author: 'Test Author',
        description: 'This is a test book description that is long enough',
        price: 10.5,
        condition: 'good',
        quantity: 1,
        language: 'Arabic',
        category: 'Fiction',
        images: ['image1.jpg'],
        status: 'DRAFT',
        sellerId: 'user-123',
      };

      const result = listingCreateSchema.safeParse(validCreateData);
      expect(result.success).toBe(true);
    });

    test('defaults status to DRAFT', () => {
      const dataWithoutStatus = {
        title: 'Test Book',
        author: 'Test Author',
        description: 'This is a test book description that is long enough',
        price: 10.5,
        condition: 'good',
        quantity: 1,
        language: 'Arabic',
        category: 'Fiction',
        images: ['image1.jpg'],
        sellerId: 'user-123',
      };

      const result = listingCreateSchema.safeParse(dataWithoutStatus);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('DRAFT');
      }
    });
  });

  describe('listingUpdateSchema', () => {
    test('allows partial updates', () => {
      const partialUpdate = {
        title: 'Updated Title',
        price: 15.0,
      };

      const result = listingUpdateSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    test('allows empty update', () => {
      const emptyUpdate = {};

      const result = listingUpdateSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(true);
    });
  });

  describe('listingPublishSchema', () => {
    test('requires images for publishing', () => {
      const dataWithoutImages = {
        title: 'Test Book',
        author: 'Test Author',
        description: 'This is a test book description that is long enough',
        price: 10.5,
        condition: 'good',
        quantity: 1,
        language: 'Arabic',
        category: 'Fiction',
        images: [],
      };

      const result = listingPublishSchema.safeParse(dataWithoutImages);
      expect(result.success).toBe(false);
    });

    test('validates complete data for publishing', () => {
      const completeData = {
        title: 'Test Book',
        author: 'Test Author',
        description: 'This is a test book description that is long enough',
        price: 10.5,
        condition: 'good',
        quantity: 1,
        language: 'Arabic',
        category: 'Fiction',
        images: ['image1.jpg', 'image2.jpg'],
      };

      const result = listingPublishSchema.safeParse(completeData);
      expect(result.success).toBe(true);
    });
  });
});
