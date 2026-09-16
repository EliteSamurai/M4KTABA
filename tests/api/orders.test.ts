// tests/api/orders.test.ts — Phase 4: order artifact model
jest.mock('@/lib/csrf', () => ({
  verifyCsrf: jest.fn(async () => null),
}));

jest.mock('@/studio-m4ktaba/client', () => ({
  readClient: { fetch: jest.fn() },
  writeClient: {
    create: jest.fn(),
    patch: jest.fn().mockReturnValue({
      dec: jest.fn().mockReturnThis(),
      setIfMissing: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      commit: jest.fn().mockResolvedValue({}),
    }),
  },
}));

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/app/api/auth/[...nextauth]/options', () => ({
  authOptions: {},
}));

import { POST, GET } from '@/app/api/orders/route';
import { getServerSession } from 'next-auth/next';
import { readClient, writeClient } from '@/studio-m4ktaba/client';
import { verifyCsrf } from '@/lib/csrf';

const mockSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;
const mockRead = readClient.fetch as jest.MockedFunction<any>;
const mockCreate = writeClient.create as jest.MockedFunction<any>;
const mockVerifyCsrf = verifyCsrf as jest.MockedFunction<any>;

function jsonRequest(body: any) {
  return { json: async () => body } as any;
}

function validBody(overrides: any = {}) {
  return {
    cart: [
      {
        id: 'book-1',
        title: 'Book A',
        quantity: 1,
        price: 10,
        user: {
          _id: 'seller-1',
          email: 'seller1@example.com',
          stripeAccountId: 'acct_1',
        },
      },
      {
        id: 'book-2',
        title: 'Book B',
        quantity: 2,
        price: 20,
        user: {
          _id: 'seller-2',
          email: 'seller2@example.com',
          stripeAccountId: 'acct_2',
        },
      },
    ],
    status: 'paid',
    userId: 'user-1',
    paymentId: 'pi_test_123',
    shippingDetails: {
      name: 'Buyer',
      street1: '1 St',
      city: 'City',
      state: 'CA',
      zip: '95035',
      country: 'US',
    },
    ...overrides,
  };
}

describe('/api/orders (Phase 4: order artifact model)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // jest.config sets resetMocks:true, which wipes factory-supplied mock
    // implementations before each test — re-establish the patch chain here.
    (writeClient.patch as jest.Mock).mockReturnValue({
      dec: jest.fn().mockReturnThis(),
      setIfMissing: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      commit: jest.fn().mockResolvedValue({}),
    });
    mockVerifyCsrf.mockResolvedValue(null);
    mockSession.mockResolvedValue({
      user: { _id: 'user-1', email: 'buyer@example.com' },
    } as any);
  });

  it('POST stores a buyer-kind, paid order and dedups only against buyer/legacy orders', async () => {
    mockRead.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ _id: 'ord-1' });

    const res = await POST(jsonRequest(validBody()));
    expect(res.status).toBe(201);

    expect(mockRead).toHaveBeenCalledWith(
      expect.stringContaining(
        '(!defined(orderKind) || orderKind == "buyer")'
      ),
      { paymentId: 'pi_test_123' }
    );
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        _type: 'order',
        orderKind: 'buyer',
        status: 'paid',
        paymentId: 'pi_test_123',
        userEmail: 'buyer@example.com',
      })
    );
  });

  it('POST returns 200 already-exists when a buyer/legacy order exists for the paymentId', async () => {
    mockRead.mockResolvedValue({ _id: 'existing-buyer-order' });
    const res = await POST(jsonRequest(validBody()));
    expect(res.status).toBe(200);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('POST rejects unauthenticated requests with 401', async () => {
    mockSession.mockResolvedValue(null);
    const res = await POST(jsonRequest(validBody()));
    expect(res.status).toBe(401);
  });

  it('GET buyer history excludes webhook seller fragments', async () => {
    mockRead.mockResolvedValue([{ _id: 'o1', status: 'paid' }]);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(mockRead).toHaveBeenCalledWith(
      expect.stringContaining(
        '(!defined(orderKind) || orderKind == "buyer")'
      ),
      { userEmail: 'buyer@example.com' }
    );
  });
});
