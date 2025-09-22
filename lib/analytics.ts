/**
 * Analytics utility for tracking user events
 */

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
}

export interface ListingEvent extends AnalyticsEvent {
  event:
    | 'listing_created'
    | 'listing_updated'
    | 'listing_published'
    | 'listing_draft_saved';
  properties: {
    listingId?: string;
    section?: string;
    hasImages?: boolean;
    imageCount?: number;
    price?: number;
    condition?: string;
    category?: string;
    language?: string;
    isbn?: string;
    qualityScore?: number;
  };
}

export interface UserEvent extends AnalyticsEvent {
  event:
    | 'user_started_listing'
    | 'user_completed_listing'
    | 'user_abandoned_listing';
  properties: {
    section?: string;
    timeSpent?: number;
    completionRate?: number;
  };
}

export interface ErrorEvent extends AnalyticsEvent {
  event: 'listing_error' | 'validation_error' | 'upload_error';
  properties: {
    errorType: string;
    errorMessage: string;
    section?: string;
    field?: string;
  };
}

class Analytics {
  private static instance: Analytics;
  private events: AnalyticsEvent[] = [];
  private isEnabled: boolean = true;

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  private constructor() {
    // Check if analytics is enabled
    this.isEnabled =
      process.env.NODE_ENV === 'production' ||
      process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';
  }

  /**
   * Track an analytics event
   */
  track(event: string, properties: Record<string, any> = {}): void {
    if (!this.isEnabled) {
      console.log('Analytics (disabled):', event, properties);
      return;
    }

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now(),
      userId: this.getUserId(),
    };

    this.events.push(analyticsEvent);
    this.sendEvent(analyticsEvent);
  }

  /**
   * Track listing-specific events
   */
  trackListing(
    event: ListingEvent['event'],
    properties: ListingEvent['properties']
  ): void {
    this.track(event, properties);
  }

  /**
   * Track user behavior events
   */
  trackUser(
    event: UserEvent['event'],
    properties: UserEvent['properties']
  ): void {
    this.track(event, properties);
  }

  /**
   * Track error events
   */
  trackError(
    event: ErrorEvent['event'],
    properties: ErrorEvent['properties']
  ): void {
    this.track(event, properties);
  }

  /**
   * Send event to analytics service
   */
  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // In a real implementation, this would send to your analytics service
      // For now, we'll just log it and potentially send to a webhook

      console.log('Analytics Event:', event);

      // Send to webhook if configured
      if (process.env.ANALYTICS_WEBHOOK_URL) {
        await fetch(process.env.ANALYTICS_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        });
      }
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  /**
   * Get current user ID
   */
  private getUserId(): string | undefined {
    // In a real implementation, this would get the user ID from the session
    if (typeof window !== 'undefined') {
      return localStorage.getItem('m4ktaba:user-id') || undefined;
    }
    return undefined;
  }

  /**
   * Set user ID for analytics
   */
  setUserId(userId: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('m4ktaba:user-id', userId);
    }
  }

  /**
   * Get all tracked events (for debugging)
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Clear all events
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * Enable or disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if analytics is enabled
   */
  isAnalyticsEnabled(): boolean {
    return this.isEnabled;
  }
}

// Export singleton instance
export const analytics = Analytics.getInstance();

// Convenience functions
export const track = (event: string, properties: Record<string, any> = {}) =>
  analytics.track(event, properties);

export const trackListing = (
  event: ListingEvent['event'],
  properties: ListingEvent['properties']
) => analytics.trackListing(event, properties);

export const trackUser = (
  event: UserEvent['event'],
  properties: UserEvent['properties']
) => analytics.trackUser(event, properties);

export const trackError = (
  event: ErrorEvent['event'],
  properties: ErrorEvent['properties']
) => analytics.trackError(event, properties);

export default analytics;
