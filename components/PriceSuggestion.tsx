'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, TrendingUp, Info, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PriceSuggestionData {
  suggestedPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  condition: string;
  isbn?: string;
  confidence: 'high' | 'medium' | 'low';
}

interface PriceSuggestionProps {
  isbn?: string;
  condition: string;
  onPriceSelect: (price: number) => void;
  className?: string;
}

export default function PriceSuggestion({
  isbn,
  condition,
  onPriceSelect,
  className,
}: PriceSuggestionProps) {
  const [suggestion, setSuggestion] = useState<PriceSuggestionData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPriceSuggestion = async () => {
    if (!condition) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        condition,
        ...(isbn && { isbn }),
      });

      const response = await fetch(`/api/suggestions/price?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get price suggestion');
      }

      setSuggestion(data);
    } catch (err) {
      console.error('Price suggestion error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to get price suggestion'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (condition) {
      fetchPriceSuggestion();
    }
  }, [condition, isbn]);

  const handleUseSuggestedPrice = () => {
    if (suggestion) {
      onPriceSelect(suggestion.suggestedPrice);
      toast({
        title: 'Price Applied',
        description: `Suggested price of $${suggestion.suggestedPrice} has been applied.`,
      });
    }
  };

  const handleUseMinPrice = () => {
    if (suggestion) {
      onPriceSelect(suggestion.priceRange.min);
      toast({
        title: 'Price Applied',
        description: `Minimum price of $${suggestion.priceRange.min} has been applied.`,
      });
    }
  };

  const handleUseMaxPrice = () => {
    if (suggestion) {
      onPriceSelect(suggestion.priceRange.max);
      toast({
        title: 'Price Applied',
        description: `Maximum price of $${suggestion.priceRange.max} has been applied.`,
      });
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceLabel = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'High Confidence';
      case 'medium':
        return 'Medium Confidence';
      case 'low':
        return 'Low Confidence';
      default:
        return 'Unknown';
    }
  };

  if (!condition) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <DollarSign className='w-5 h-5' />
          Price Suggestion
        </CardTitle>
        <p className='text-sm text-muted-foreground'>
          Get a suggested price based on condition and market data
        </p>
      </CardHeader>
      <CardContent className='space-y-4'>
        {isLoading && (
          <div className='flex items-center justify-center py-4'>
            <Loader2 className='w-6 h-6 animate-spin mr-2' />
            <span className='text-sm text-muted-foreground'>
              Analyzing market data...
            </span>
          </div>
        )}

        {error && (
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {suggestion && (
          <div className='space-y-4'>
            <div className='text-center'>
              <div className='text-3xl font-bold text-green-600 mb-2'>
                ${suggestion.suggestedPrice}
              </div>
              <Badge
                variant='outline'
                className={getConfidenceColor(suggestion.confidence)}
              >
                {getConfidenceLabel(suggestion.confidence)}
              </Badge>
            </div>

            <div className='space-y-2'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-muted-foreground'>
                  Price Range:
                </span>
                <span className='text-sm font-medium'>
                  ${suggestion.priceRange.min} - ${suggestion.priceRange.max}
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-muted-foreground'>
                  Condition:
                </span>
                <span className='text-sm font-medium capitalize'>
                  {suggestion.condition.replace('-', ' ')}
                </span>
              </div>
              {suggestion.isbn && (
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-muted-foreground'>ISBN:</span>
                  <span className='text-sm font-medium font-mono'>
                    {suggestion.isbn}
                  </span>
                </div>
              )}
            </div>

            <div className='space-y-2'>
              <Button
                onClick={handleUseSuggestedPrice}
                className='w-full'
                size='sm'
              >
                <TrendingUp className='w-4 h-4 mr-2' />
                Use Suggested Price (${suggestion.suggestedPrice})
              </Button>

              <div className='grid grid-cols-2 gap-2'>
                <Button onClick={handleUseMinPrice} variant='outline' size='sm'>
                  Min: ${suggestion.priceRange.min}
                </Button>
                <Button onClick={handleUseMaxPrice} variant='outline' size='sm'>
                  Max: ${suggestion.priceRange.max}
                </Button>
              </div>
            </div>

            <Alert>
              <Info className='h-4 w-4' />
              <AlertDescription className='text-xs'>
                <div className='space-y-1'>
                  <p className='font-medium'>Pricing Tips:</p>
                  <ul className='list-disc list-inside space-y-1'>
                    <li>Consider the book's condition and rarity</li>
                    <li>Check similar listings for reference</li>
                    <li>Factor in shipping costs and platform fees</li>
                    <li>Price competitively to attract buyers</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className='text-xs text-muted-foreground'>
          <p>• Prices are based on market data and condition</p>
          <p>• Suggestions are estimates, not guarantees</p>
          <p>• Consider your specific book's unique factors</p>
        </div>
      </CardContent>
    </Card>
  );
}
