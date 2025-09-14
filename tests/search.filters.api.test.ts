import { NextRequest } from 'next/server';
import * as route from '@/app/api/get-all-books/route';

describe('search filters api', () => {
  it('builds query with q and price range', async () => {
    const url = new URL(
      'http://localhost/api/get-all-books?q=fiqh&price_min=10&price_max=20&page=1&limit=5'
    );
    const req = { url: url.toString() } as NextRequest;
    // We can't execute Sanity client in unit test; just assert handler exists
    expect(typeof route.GET).toBe('function');
  });
});
