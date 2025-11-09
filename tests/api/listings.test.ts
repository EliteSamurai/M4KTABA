// Set environment variables for Sanity before any imports
process.env.SANITY_PROJECT_ID = 'test-project';
process.env.SANITY_DATASET = 'test-dataset';
process.env.SANITY_TOKEN = 'test-token';

// Mock Sanity client first - this must be before any imports
jest.mock('@/lib/sanityClient', () => ({
  readClient: {
    fetch: jest.fn(),
  },
  writeClient: {
    create: jest.fn(),
    patch: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    commit: jest.fn(),
  },
  getSanityClients: jest.fn().mockResolvedValue({
    readClient: {
      fetch: jest.fn(),
    },
    writeClient: {
      create: jest.fn(),
      patch: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      commit: jest.fn(),
    },
  }),
  isSanityConfigured: jest.fn(() => true),
}));

import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/listings/route';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock NextAuth default export
jest.mock('next-auth/next', () => ({
  default: jest.fn(),
}));

// Mock the NextAuth export from options
jest.mock('@/app/api/auth/[...nextauth]/options', () => ({
  authOptions: {},
  default: jest.fn(),
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;
const mockGetSanityClients = require('@/lib/sanityClient').getSanityClients;
const mockIsSanityConfigured = require('@/lib/sanityClient').isSanityConfigured;

describe('/api/listings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock authenticated session for all tests
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'test-user',
        _id: 'test-user',
        email: 'test@example.com',
        stripeAccountId: 'acct_test',
      },
    } as any);

    mockIsSanityConfigured.mockReturnValue(true);
    mockGetSanityClients.mockResolvedValue({
      readClient: {
        fetch: jest.fn(),
      },
      writeClient: {
        create: jest.fn(),
        patch: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        commit: jest.fn(),
      },
    });
  });

  describe('POST /api/listings', () => {
    test('creates listing successfully', async () => {
      const mockReadClient = {
        fetch: jest
          .fn()
          .mockResolvedValueOnce(null) // category lookup
          .mockResolvedValueOnce({ _id: 'user-123' }) // user lookup
          .mockResolvedValueOnce({
            _id: 'listing-123',
            title: 'Test Book',
            author: 'Test Author',
            price: 10,
            quantity: 1,
            photos: [],
            user: { _id: 'test-user', name: 'Seller', email: 'seller@example.com' },
          }),
      };
      const mockWriteClient = {
        create: jest
          .fn()
          .mockResolvedValueOnce({ _id: 'category-123' })
          .mockResolvedValueOnce({ _id: 'listing-123' }),
        patch: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        commit: jest.fn(),
      };

      mockGetSanityClients.mockResolvedValue({
        readClient: mockReadClient,
        writeClient: mockWriteClient,
      });

      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Book',
          author: 'Test Author',
          description: 'Test description that is long enough',
          price: 10.0,
          condition: 'good',
          quantity: 1,
          language: 'Arabic',
          category: 'Fiction',
          images: ['imageAsset1'],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      console.log('Response status:', response.status);
      console.log('Response data:', data);

      expect(response.status).toBe(201);
      expect(data.id).toBe('listing-123');
      expect(mockWriteClient.create).toHaveBeenLastCalledWith(
        expect.objectContaining({
          _type: 'book',
          title: 'Test Book',
          status: 'published',
        })
      );
      expect(data.book.title).toBe('Test Book');
    });

    test('returns 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('UNAUTHORIZED');
    });

    test('returns 422 for invalid data', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'test-user',
          _id: 'test-user',
          stripeAccountId: 'acct_test',
        },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        body: JSON.stringify({
          title: '', // Invalid: empty title
          price: -1, // Invalid: negative price
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.fieldErrors).toBeDefined();
    });

    test('returns 500 when Sanity is not configured', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'test-user',
          _id: 'test-user',
          stripeAccountId: 'acct_test',
        },
      } as any);

      mockIsSanityConfigured.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Book',
          author: 'Test Author',
          description: 'Test description',
          price: 10.0,
          condition: 'good',
          quantity: 1,
          language: 'Arabic',
          category: 'Fiction',
          images: ['imageAsset1'],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('CONFIGURATION_ERROR');
    });
  });

  describe('GET /api/listings', () => {
    test('fetches user listings successfully', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'test-user',
          _id: 'test-user',
          stripeAccountId: 'acct_test',
        },
      } as any);

      const mockReadClient = {
        fetch: jest.fn().mockResolvedValue([
          { _id: 'listing-1', title: 'Book 1' },
          { _id: 'listing-2', title: 'Book 2' },
        ]),
      };

      mockGetSanityClients.mockResolvedValue({
        readClient: mockReadClient,
        writeClient: {},
      });

      const request = new NextRequest('http://localhost:3000/api/listings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.listings).toHaveLength(2);
      expect(data.listings[0].title).toBe('Book 1');
    });

    test('returns 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/listings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('UNAUTHORIZED');
    });
  });
});
