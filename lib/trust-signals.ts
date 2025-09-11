/**
 * Trust signals and social proof management
 */

export interface TrustSignal {
  id: string;
  type:
    | 'security'
    | 'social_proof'
    | 'guarantee'
    | 'certification'
    | 'testimonial';
  title: string;
  description: string;
  icon: string;
  verified: boolean;
  priority: number;
  visible: boolean;
}

export interface UserReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
  helpful: number;
  productId?: string;
  sellerId?: string;
}

export interface TrustMetrics {
  totalUsers: number;
  totalBooks: number;
  totalSales: number;
  averageRating: number;
  totalReviews: number;
  verifiedSellers: number;
  successRate: number;
  responseTime: string;
}

export const DEFAULT_TRUST_SIGNALS: TrustSignal[] = [
  {
    id: 'ssl_security',
    type: 'security',
    title: 'SSL Secured',
    description: '256-bit encryption',
    icon: 'Shield',
    verified: true,
    priority: 1,
    visible: true,
  },
  {
    id: 'stripe_payments',
    type: 'security',
    title: 'Secure Payments',
    description: 'Stripe powered',
    icon: 'Lock',
    verified: true,
    priority: 2,
    visible: true,
  },
  {
    id: 'free_shipping',
    type: 'guarantee',
    title: 'Free Shipping',
    description: 'On all orders',
    icon: 'Truck',
    verified: true,
    priority: 3,
    visible: true,
  },
  {
    id: 'money_back',
    type: 'guarantee',
    title: 'Money Back',
    description: '30-day guarantee',
    icon: 'CheckCircle',
    verified: true,
    priority: 4,
    visible: true,
  },
  {
    id: 'verified_sellers',
    type: 'certification',
    title: 'Verified Sellers',
    description: 'Identity verified',
    icon: 'Award',
    verified: true,
    priority: 5,
    visible: true,
  },
  // Removed fake user rating - only show real ratings when available
];

export class TrustSignalsManager {
  private signals: TrustSignal[];
  private reviews: UserReview[];
  private metrics: TrustMetrics;

  constructor() {
    this.signals = [...DEFAULT_TRUST_SIGNALS];
    this.reviews = [];
    this.metrics = this.getDefaultMetrics();
  }

  private getDefaultMetrics(): TrustMetrics {
    return {
      totalUsers: 0,
      totalBooks: 0,
      totalSales: 0,
      averageRating: 0,
      totalReviews: 0,
      verifiedSellers: 0,
      successRate: 0,
      responseTime: 'N/A',
    };
  }

  getSignals(type?: TrustSignal['type']): TrustSignal[] {
    if (type) {
      return this.signals.filter(
        signal => signal.type === type && signal.visible
      );
    }
    return this.signals.filter(signal => signal.visible);
  }

  getSignal(id: string): TrustSignal | undefined {
    return this.signals.find(signal => signal.id === id);
  }

  addSignal(signal: Omit<TrustSignal, 'id'>): string {
    const id = `signal_${Date.now()}`;
    const newSignal: TrustSignal = { ...signal, id };
    this.signals.push(newSignal);
    return id;
  }

  updateSignal(id: string, updates: Partial<TrustSignal>): boolean {
    const index = this.signals.findIndex(signal => signal.id === id);
    if (index !== -1) {
      this.signals[index] = { ...this.signals[index], ...updates };
      return true;
    }
    return false;
  }

  removeSignal(id: string): boolean {
    const index = this.signals.findIndex(signal => signal.id === id);
    if (index !== -1) {
      this.signals.splice(index, 1);
      return true;
    }
    return false;
  }

  getReviews(limit?: number): UserReview[] {
    const sortedReviews = this.reviews.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return limit ? sortedReviews.slice(0, limit) : sortedReviews;
  }

  addReview(review: Omit<UserReview, 'id'>): string {
    const id = `review_${Date.now()}`;
    const newReview: UserReview = { ...review, id };
    this.reviews.push(newReview);
    this.updateMetrics();
    return id;
  }

  getReviewsByRating(rating: number): UserReview[] {
    return this.reviews.filter(review => review.rating === rating);
  }

  getVerifiedReviews(): UserReview[] {
    return this.reviews.filter(review => review.verified);
  }

  getAverageRating(): number {
    if (this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / this.reviews.length) * 10) / 10;
  }

  getMetrics(): TrustMetrics {
    return { ...this.metrics };
  }

  updateMetrics(): void {
    this.metrics = {
      ...this.metrics,
      averageRating: this.getAverageRating(),
      totalReviews: this.reviews.length,
    };
  }

  getTrustScore(): number {
    const signals = this.getSignals();
    const verifiedSignals = signals.filter(signal => signal.verified);
    const signalScore = (verifiedSignals.length / signals.length) * 40;

    const ratingScore = (this.metrics.averageRating / 5) * 30;
    const reviewScore = Math.min(this.metrics.totalReviews / 100, 1) * 20;
    const successScore = (this.metrics.successRate / 100) * 10;

    return Math.round(signalScore + ratingScore + reviewScore + successScore);
  }

  getTrustLevel(): 'low' | 'medium' | 'high' | 'excellent' {
    const score = this.getTrustScore();
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  getTrustBadges(): TrustSignal[] {
    return this.getSignals().filter(
      signal => signal.type === 'certification' || signal.type === 'guarantee'
    );
  }

  getSecurityBadges(): TrustSignal[] {
    return this.getSignals().filter(signal => signal.type === 'security');
  }

  getSocialProofBadges(): TrustSignal[] {
    return this.getSignals().filter(signal => signal.type === 'social_proof');
  }

  generateTestimonial(): string {
    // No fake testimonials - only return real user testimonials
    return '';
  }

  getRecentActivity(): Array<{
    type: 'sale' | 'review' | 'signup' | 'listing';
    message: string;
    timestamp: string;
  }> {
    // No fake activity - only return real user activity
    return [];
  }
}

// Singleton instance
export const trustSignalsManager = new TrustSignalsManager();

// Utility functions
export function getTrustSignals(type?: TrustSignal['type']): TrustSignal[] {
  return trustSignalsManager.getSignals(type);
}

export function getTrustScore(): number {
  return trustSignalsManager.getTrustScore();
}

export function getTrustLevel(): 'low' | 'medium' | 'high' | 'excellent' {
  return trustSignalsManager.getTrustLevel();
}

export function getTrustMetrics(): TrustMetrics {
  return trustSignalsManager.getMetrics();
}

export function addTrustReview(review: Omit<UserReview, 'id'>): string {
  return trustSignalsManager.addReview(review);
}

export function getRecentReviews(limit: number = 5): UserReview[] {
  return trustSignalsManager.getReviews(limit);
}

export function getAverageRating(): number {
  return trustSignalsManager.getAverageRating();
}

// Trust signal presets
export const TRUST_SIGNAL_PRESETS = {
  homepage: ['ssl_security', 'stripe_payments', 'user_rating', 'free_shipping'],
  checkout: [
    'ssl_security',
    'stripe_payments',
    'money_back',
    'verified_sellers',
  ],
  product: ['verified_sellers', 'user_rating', 'money_back'],
  profile: ['verified_sellers', 'user_rating'],
} as const;

export function getTrustSignalsForContext(
  context: keyof typeof TRUST_SIGNAL_PRESETS
): TrustSignal[] {
  const signalIds = TRUST_SIGNAL_PRESETS[context];
  return signalIds
    .map(id => trustSignalsManager.getSignal(id))
    .filter((signal): signal is TrustSignal => signal !== undefined);
}
