import { NextRequest, NextResponse } from 'next/server';

// Mock price suggestion logic - in production, this would integrate with real pricing data
function calculateSuggestedPrice(
  isbn: string | null,
  condition: string
): number {
  // Base prices for different book types
  const basePrices: Record<string, number> = {
    '978-0-123456-78-9': 25.0, // Quran
    '978-0-123456-79-6': 35.0, // Hadith
    '978-0-123456-80-2': 30.0, // Fiqh
  };

  // Condition multipliers
  const conditionMultipliers: Record<string, number> = {
    new: 1.0,
    'like-new': 0.8,
    good: 0.6,
    fair: 0.4,
    poor: 0.2,
  };

  // Get base price (default to $20 if not found)
  const basePrice = isbn ? basePrices[isbn] || 20.0 : 20.0;

  // Apply condition multiplier
  const conditionMultiplier = conditionMultipliers[condition] || 0.5;

  // Calculate suggested price
  const suggestedPrice = basePrice * conditionMultiplier;

  // Round to nearest dollar
  return Math.round(suggestedPrice);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isbn = searchParams.get('isbn');
    const condition = searchParams.get('condition');

    if (!condition) {
      return NextResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Condition parameter is required',
        },
        { status: 400 }
      );
    }

    // Validate condition
    const validConditions = ['new', 'like-new', 'good', 'fair', 'poor'];
    if (!validConditions.includes(condition)) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Invalid condition value' },
        { status: 400 }
      );
    }

    // Calculate suggested price
    const suggestedPrice = calculateSuggestedPrice(isbn, condition);

    // Generate price range (±20% of suggested price)
    const minPrice = Math.max(1, Math.round(suggestedPrice * 0.8));
    const maxPrice = Math.round(suggestedPrice * 1.2);

    return NextResponse.json({
      suggestedPrice,
      priceRange: {
        min: minPrice,
        max: maxPrice,
      },
      condition,
      isbn: isbn || null,
      confidence: isbn ? 'high' : 'medium', // Higher confidence if ISBN is provided
    });
  } catch (error) {
    console.error('Error generating price suggestion:', error);
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate price suggestion',
      },
      { status: 500 }
    );
  }
}
