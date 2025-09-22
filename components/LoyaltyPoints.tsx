'use client';

import { useState, useEffect } from 'react';
import {
  getLoyaltyTier,
  getNextTier,
  getPointsToNextTier,
  formatLoyaltyPoints,
  LoyaltyTier,
} from '@/lib/loyalty';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Star, Gift } from 'lucide-react';

interface LoyaltyPointsProps {
  userId: string;
  className?: string;
}

interface LoyaltyData {
  totalSpent: number;
  totalPoints: number;
  tier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  pointsToNext: number;
}

export function LoyaltyPoints({ userId, className = '' }: LoyaltyPointsProps) {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoyaltyData();
  }, [userId]);

  const fetchLoyaltyData = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/loyalty`);
      if (response.ok) {
        const data = await response.json();
        setLoyaltyData(data);
      }
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className='p-6'>
          <div className='animate-pulse space-y-4'>
            <div className='h-4 bg-gray-200 rounded w-1/4'></div>
            <div className='h-4 bg-gray-200 rounded w-1/2'></div>
            <div className='h-4 bg-gray-200 rounded w-3/4'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!loyaltyData) {
    return null;
  }

  const { totalSpent, totalPoints, tier, nextTier, pointsToNext } = loyaltyData;
  const progressToNext = nextTier
    ? (totalSpent / nextTier.minSpent) * 100
    : 100;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Crown className='h-5 w-5 text-yellow-600' />
          Loyalty Program
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Current Tier */}
        <div className='flex items-center justify-between'>
          <div>
            <Badge className={tier.color}>{tier.name} Member</Badge>
            <p className='text-sm text-gray-600 mt-1'>
              {formatLoyaltyPoints(totalPoints)} points earned
            </p>
          </div>
          <div className='text-right'>
            <p className='text-2xl font-bold'>${totalSpent.toFixed(0)}</p>
            <p className='text-sm text-gray-600'>total spent</p>
          </div>
        </div>

        {/* Progress to Next Tier */}
        {nextTier && (
          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span>Progress to {nextTier.name}</span>
              <span>${pointsToNext.toFixed(0)} to go</span>
            </div>
            <Progress value={progressToNext} className='h-2' />
            <p className='text-xs text-gray-600'>
              Spend ${pointsToNext.toFixed(0)} more to reach {nextTier.name}{' '}
              tier
            </p>
          </div>
        )}

        {/* Benefits */}
        <div className='space-y-2'>
          <h4 className='font-medium text-sm'>Your Benefits:</h4>
          <div className='space-y-1'>
            {tier.benefits.map((benefit, index) => (
              <div key={index} className='flex items-center gap-2 text-sm'>
                <Star className='h-3 w-3 text-yellow-500' />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Next Tier Preview */}
        {nextTier && (
          <div className='bg-gray-50 p-3 rounded-lg'>
            <div className='flex items-center gap-2 mb-2'>
              <Gift className='h-4 w-4 text-purple-600' />
              <span className='font-medium text-sm'>
                Unlock {nextTier.name} benefits:
              </span>
            </div>
            <div className='space-y-1'>
              {nextTier.benefits.slice(0, 2).map((benefit, index) => (
                <div
                  key={index}
                  className='flex items-center gap-2 text-xs text-gray-600'
                >
                  <Star className='h-3 w-3 text-purple-500' />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

