import { NextRequest, NextResponse } from 'next/server';
import {
  type ProductFilter,
  type SearchResponse,
  buildSearchQuery,
  sortResults,
  generateFacets,
  calculateRelevanceScore,
} from '@/lib/product-discovery';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  // Parse search parameters
  const query = searchParams.get('q') || '';
  const filters: ProductFilter = {
    minPrice: searchParams.get('minPrice')
      ? parseFloat(searchParams.get('minPrice')!)
      : undefined,
    maxPrice: searchParams.get('maxPrice')
      ? parseFloat(searchParams.get('maxPrice')!)
      : undefined,
    categories: searchParams.get('categories')?.split(',').filter(Boolean),
    sellerId: searchParams.get('sellerId') || undefined,
    sellerCountry: searchParams.get('sellerCountry') || undefined,
    inStock: searchParams.get('inStock') === 'true',
    freeShipping: searchParams.get('freeShipping') === 'true',
    language: searchParams.get('language') || undefined,
    currency: searchParams.get('currency') || 'USD',
    minRating: searchParams.get('minRating')
      ? parseFloat(searchParams.get('minRating')!)
      : undefined,
    sortBy: (searchParams.get('sortBy') as any) || 'relevance',
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
  };

  try {
    // Build and execute search query
    const groqQuery = buildSearchQuery(query, filters);

    // TODO: Execute query against Sanity
    // const { readClient } = await import('@/studio-m4ktaba/client');
    // const rawResults = await readClient.fetch(groqQuery);

    // Mock results for now
    const rawResults: any[] = [];

    // Transform results
    const results = rawResults.map((result) => {
      const product = {
        id: result._id,
        title: result.title || '',
        description: result.description || '',
        price: result.price || 0,
        currency: filters.currency || 'USD',
        image: result.image || '',
        seller: {
          id: result.user?._id || '',
          name: result.user?.name || 'Unknown Seller',
          rating: 4.5,
          country: result.user?.location?.country || 'US',
        },
        category: result.selectedCategory?.title || 'Uncategorized',
        tags: [],
        inStock: (result.quantity || 0) > 0,
        freeShipping: false,
        rating: result.rating || 0,
        reviewCount: result.reviewCount || 0,
        createdAt: result._createdAt || new Date().toISOString(),
      };

      // Calculate relevance score if searching
      if (query) {
        return {
          ...product,
          relevanceScore: calculateRelevanceScore(product, query),
        };
      }

      return product;
    });

    // Sort results
    const sortedResults = sortResults(results, filters.sortBy || 'relevance');

    // Generate facets
    const facets = generateFacets(sortedResults);

    // Paginate
    const start = ((filters.page || 1) - 1) * (filters.limit || 20);
    const end = start + (filters.limit || 20);
    const paginatedResults = sortedResults.slice(start, end);

    const response: SearchResponse = {
      results: paginatedResults,
      total: sortedResults.length,
      page: filters.page || 1,
      totalPages: Math.ceil(sortedResults.length / (filters.limit || 20)),
      facets,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

