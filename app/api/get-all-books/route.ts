import { NextRequest, NextResponse } from 'next/server';
import { readClient } from '@/studio-m4ktaba/client'; // Adjust the path as needed

function toNumber(v: string | null, def: number) {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : def;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = toNumber(searchParams.get('limit'), 10);
  const offset = toNumber(searchParams.get('offset'), 0);
  const page = toNumber(searchParams.get('page'), 1);

  // Calculate start position - use offset if provided, otherwise use page
  const start = offset > 0 ? offset : (page - 1) * limit;
  const q = (searchParams.get('q') || '').trim();
  const author = (searchParams.get('author') || '').trim();
  const language = (searchParams.get('language') || '').trim();
  const condition = (searchParams.get('condition') || '').trim();
  const priceMin = toNumber(searchParams.get('price_min'), 0);
  const priceMax = toNumber(searchParams.get('price_max'), 0);
  const sort = (searchParams.get('sort') || 'new').trim();

  const end = start + limit;

  try {
    const filters: string[] = ["_type == 'book'", 'quantity > 0'];
    const params: Record<string, unknown> = {};
    if (q) {
      filters.push('title match $q');
      params.q = `${q}*`;
    }
    if (author) {
      filters.push('author match $author');
      params.author = `${author}*`;
    }
    if (language) {
      filters.push('language == $language');
      params.language = language;
    }
    if (condition) {
      filters.push('condition == $condition');
      params.condition = condition;
    }
    if (priceMin > 0) {
      filters.push('price >= $priceMin');
      params.priceMin = priceMin;
    }
    if (priceMax > 0) {
      filters.push('price <= $priceMax');
      params.priceMax = priceMax;
    }
    const orderBy =
      sort === 'price_asc'
        ? 'price asc'
        : sort === 'price_desc'
          ? 'price desc'
          : '_createdAt desc';

    const where = filters.join(' && ');
    const books = await (readClient as any).fetch(
      `*[${where}] | order(${orderBy}) [${start}...${end}] {
        _id,
        title,
        "user": user->{_id, email, location, stripeAccountId},
        price,
        "image": photos[0].asset._ref,
        language,
        condition
      }`,
      params
    );

    const total = await (readClient as any).fetch(`count(*[${where}])`, params);
    return NextResponse.json({
      books,
      total,
      page: offset > 0 ? Math.floor(offset / limit) + 1 : page,
      limit,
      offset: start,
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}
