/**
 * Global Product Discovery System
 * Advanced search, filtering, and localization
 */

export interface ProductFilter {
  // Price range
  minPrice?: number;
  maxPrice?: number;

  // Categories
  categories?: string[];

  // Seller
  sellerId?: string;
  sellerCountry?: string;

  // Availability
  inStock?: boolean;
  freeShipping?: boolean;

  // Language/Localization
  language?: string;
  currency?: string;

  // Ratings
  minRating?: number;

  // Sorting
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'rating';

  // Pagination
  page?: number;
  limit?: number;
}

export interface ProductSearchResult {
  id: string;
  title: string;
  titleTranslations?: Record<string, string>;
  description: string;
  descriptionTranslations?: Record<string, string>;
  price: number;
  currency: string;
  image: string;
  seller: {
    id: string;
    name: string;
    rating: number;
    country: string;
  };
  category: string;
  tags: string[];
  inStock: boolean;
  freeShipping: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  relevanceScore?: number;
}

export interface SearchResponse {
  results: ProductSearchResult[];
  total: number;
  page: number;
  totalPages: number;
  facets: {
    categories: Array<{ name: string; count: number }>;
    priceRanges: Array<{ range: string; count: number }>;
    sellers: Array<{ name: string; count: number }>;
    languages: Array<{ code: string; count: number }>;
  };
}

/**
 * Build search query for Sanity/Database
 */
export function buildSearchQuery(
  searchTerm: string,
  filters: ProductFilter
): string {
  const conditions: string[] = ['_type == "book"'];

  // Text search
  if (searchTerm) {
    conditions.push(
      `(title match "${searchTerm}*" || description match "${searchTerm}*" || author match "${searchTerm}*")`
    );
  }

  // Price filter
  if (filters.minPrice !== undefined) {
    conditions.push(`price >= ${filters.minPrice}`);
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(`price <= ${filters.maxPrice}`);
  }

  // Category filter
  if (filters.categories && filters.categories.length > 0) {
    const categoryConditions = filters.categories
      .map((cat) => `selectedCategory._ref == "${cat}"`)
      .join(' || ');
    conditions.push(`(${categoryConditions})`);
  }

  // Seller filter
  if (filters.sellerId) {
    conditions.push(`user._ref == "${filters.sellerId}"`);
  }

  // Stock filter
  if (filters.inStock) {
    conditions.push('quantity > 0');
  }

  // Build GROQ query
  const whereClause = conditions.join(' && ');
  const sortClause = getSortClause(filters.sortBy);

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  return `*[${whereClause}] | order(${sortClause}) [${offset}...${offset + limit}] {
    _id,
    title,
    description,
    author,
    price,
    image,
    quantity,
    rating,
    reviewCount,
    selectedCategory->{_id, title},
    user->{_id, name, location},
    _createdAt
  }`;
}

/**
 * Get sort clause for GROQ query
 */
function getSortClause(sortBy?: string): string {
  switch (sortBy) {
    case 'price_asc':
      return 'price asc';
    case 'price_desc':
      return 'price desc';
    case 'newest':
      return '_createdAt desc';
    case 'popular':
      return 'sales desc';
    case 'rating':
      return 'rating desc';
    default:
      return '_score desc, _createdAt desc';
  }
}

/**
 * Calculate relevance score for search results
 */
export function calculateRelevanceScore(
  result: ProductSearchResult,
  searchTerm: string
): number {
  let score = 0;

  const term = searchTerm.toLowerCase();
  const title = result.title.toLowerCase();
  const description = result.description.toLowerCase();

  // Exact title match: +100
  if (title === term) score += 100;

  // Title starts with term: +50
  if (title.startsWith(term)) score += 50;

  // Title contains term: +25
  if (title.includes(term)) score += 25;

  // Description contains term: +10
  if (description.includes(term)) score += 10;

  // Boost by rating: 0-50
  score += result.rating * 10;

  // Boost by review count: 0-20
  score += Math.min(result.reviewCount / 5, 20);

  // Penalize out of stock: -30
  if (!result.inStock) score -= 30;

  return score;
}

/**
 * Apply filters to search results (client-side filtering)
 */
export function applyFilters(
  results: ProductSearchResult[],
  filters: ProductFilter
): ProductSearchResult[] {
  return results.filter((product) => {
    // Price filter
    if (filters.minPrice !== undefined && product.price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice !== undefined && product.price > filters.maxPrice) {
      return false;
    }

    // Category filter
    if (
      filters.categories &&
      filters.categories.length > 0 &&
      !filters.categories.includes(product.category)
    ) {
      return false;
    }

    // Seller filter
    if (filters.sellerId && product.seller.id !== filters.sellerId) {
      return false;
    }

    // Seller country filter
    if (
      filters.sellerCountry &&
      product.seller.country !== filters.sellerCountry
    ) {
      return false;
    }

    // Stock filter
    if (filters.inStock && !product.inStock) {
      return false;
    }

    // Free shipping filter
    if (filters.freeShipping && !product.freeShipping) {
      return false;
    }

    // Rating filter
    if (filters.minRating && product.rating < filters.minRating) {
      return false;
    }

    return true;
  });
}

/**
 * Sort search results
 */
export function sortResults(
  results: ProductSearchResult[],
  sortBy: string
): ProductSearchResult[] {
  const sorted = [...results];

  switch (sortBy) {
    case 'price_asc':
      return sorted.sort((a, b) => a.price - b.price);

    case 'price_desc':
      return sorted.sort((a, b) => b.price - a.price);

    case 'newest':
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    case 'popular':
      return sorted.sort((a, b) => b.reviewCount - a.reviewCount);

    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating);

    case 'relevance':
    default:
      return sorted.sort(
        (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)
      );
  }
}

/**
 * Generate facets for filtering
 */
export function generateFacets(
  results: ProductSearchResult[]
): SearchResponse['facets'] {
  // Category facets
  const categoryMap = new Map<string, number>();
  results.forEach((r) => {
    categoryMap.set(r.category, (categoryMap.get(r.category) || 0) + 1);
  });

  const categories = Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Price range facets
  const priceRanges = [
    { range: '$0-$25', count: 0 },
    { range: '$25-$50', count: 0 },
    { range: '$50-$100', count: 0 },
    { range: '$100+', count: 0 },
  ];

  results.forEach((r) => {
    if (r.price < 25) priceRanges[0].count++;
    else if (r.price < 50) priceRanges[1].count++;
    else if (r.price < 100) priceRanges[2].count++;
    else priceRanges[3].count++;
  });

  // Seller facets
  const sellerMap = new Map<string, number>();
  results.forEach((r) => {
    sellerMap.set(r.seller.name, (sellerMap.get(r.seller.name) || 0) + 1);
  });

  const sellers = Array.from(sellerMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 sellers

  // Language facets (if available)
  const languages: Array<{ code: string; count: number }> = [];

  return {
    categories,
    priceRanges,
    sellers,
    languages,
  };
}

/**
 * Get translated product field
 */
export function getTranslatedField(
  field: string,
  translations: Record<string, string> | undefined,
  locale: string,
  fallback: string
): string {
  if (!translations) return field || fallback;

  return translations[locale] || field || fallback;
}

/**
 * Convert price to user's currency
 */
export async function convertProductPrice(
  product: ProductSearchResult,
  targetCurrency: string
): Promise<number> {
  if (product.currency === targetCurrency) {
    return product.price;
  }

  // Use currency conversion utility
  const { convertPrice } = await import('./currency');
  return convertPrice(product.price, targetCurrency);
}

/**
 * Build search suggestions (autocomplete)
 */
export interface SearchSuggestion {
  type: 'product' | 'category' | 'seller';
  text: string;
  id?: string;
  count?: number;
}

export function buildSearchSuggestions(
  searchTerm: string,
  recentSearches: string[],
  popularProducts: ProductSearchResult[],
  categories: string[]
): SearchSuggestion[] {
  const suggestions: SearchSuggestion[] = [];
  const term = searchTerm.toLowerCase();

  // Recent searches
  recentSearches
    .filter((search) => search.toLowerCase().includes(term))
    .forEach((search) => {
      suggestions.push({
        type: 'product',
        text: search,
      });
    });

  // Matching categories
  categories
    .filter((cat) => cat.toLowerCase().includes(term))
    .forEach((cat) => {
      suggestions.push({
        type: 'category',
        text: cat,
      });
    });

  // Matching products
  popularProducts
    .filter((p) => p.title.toLowerCase().includes(term))
    .slice(0, 5)
    .forEach((product) => {
      suggestions.push({
        type: 'product',
        text: product.title,
        id: product.id,
      });
    });

  return suggestions.slice(0, 10);
}

/**
 * Save search to history
 */
export function saveSearchHistory(
  searchTerm: string,
  userId?: string
): void {
  if (!searchTerm.trim()) return;

  const key = userId ? `search_history_${userId}` : 'search_history';
  const history = JSON.parse(localStorage.getItem(key) || '[]');

  // Add to front, remove duplicates, keep last 20
  const updated = [
    searchTerm,
    ...history.filter((s: string) => s !== searchTerm),
  ].slice(0, 20);

  localStorage.setItem(key, JSON.stringify(updated));
}

/**
 * Get search history
 */
export function getSearchHistory(userId?: string): string[] {
  const key = userId ? `search_history_${userId}` : 'search_history';
  return JSON.parse(localStorage.getItem(key) || '[]');
}

