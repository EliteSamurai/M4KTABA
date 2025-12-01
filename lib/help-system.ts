/**
 * Help system utilities and management
 */

export interface HelpItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  priority: number;
  visible: boolean;
  lastUpdated: string;
}

export interface HelpCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  items: string[];
}

export interface HelpSearchResult {
  item: HelpItem;
  score: number;
  matchedFields: string[];
}

export interface HelpContext {
  page: string;
  section?: string;
  action?: string;
  userType?: 'buyer' | 'seller' | 'guest';
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Learn the basics of using M4ktaba',
    icon: 'Play',
    color: 'blue',
    items: [],
  },
  {
    id: 'buying',
    name: 'Buying Books',
    description: 'How to find and purchase books',
    icon: 'ShoppingCart',
    color: 'green',
    items: [],
  },
  {
    id: 'selling',
    name: 'Selling Books',
    description: 'How to list and sell your books',
    icon: 'DollarSign',
    color: 'purple',
    items: [],
  },
  {
    id: 'account',
    name: 'Account & Profile',
    description: 'Managing your account and profile',
    icon: 'User',
    color: 'orange',
    items: [],
  },
  {
    id: 'payments',
    name: 'Payments & Billing',
    description: 'Payment methods and billing information',
    icon: 'CreditCard',
    color: 'red',
    items: [],
  },
  {
    id: 'shipping',
    name: 'Shipping & Delivery',
    description: 'Shipping options and delivery information',
    icon: 'Truck',
    color: 'indigo',
    items: [],
  },
  {
    id: 'troubleshooting',
    name: 'Troubleshooting',
    description: 'Common issues and solutions',
    icon: 'Wrench',
    color: 'yellow',
    items: [],
  },
];

export const DEFAULT_HELP_ITEMS: HelpItem[] = [
  {
    id: 'how-to-sign-up',
    title: 'How to create an account',
    content:
      "To create an account, click the 'Sign Up' button in the top right corner. You can sign up with your email address or use Google. After signing up, you'll need to complete your profile with your address and bio.",
    category: 'getting-started',
    tags: ['account', 'signup', 'registration'],
    priority: 1,
    visible: true,
    lastUpdated: '2024-01-15',
  },
  {
    id: 'how-to-buy-books',
    title: 'How to buy books',
    content:
      'Browse our collection by category or use the search bar. Click on a book to view details, then add it to your cart. Proceed to checkout and enter your shipping information. Payment is processed securely through Stripe.',
    category: 'buying',
    tags: ['buying', 'checkout', 'payment'],
    priority: 1,
    visible: true,
    lastUpdated: '2024-01-15',
  },
  {
    id: 'how-to-sell-books',
    title: 'How to sell books',
    content:
      "Click 'Start Selling' to list your books. Upload photos, write a description, and set your price. Once someone buys your book, you'll receive payment and shipping instructions. We handle the payment processing for you.",
    category: 'selling',
    tags: ['selling', 'listing', 'pricing'],
    priority: 1,
    visible: true,
    lastUpdated: '2024-01-15',
  },
  {
    id: 'payment-methods',
    title: 'Accepted payment methods',
    content:
      'We accept all major credit cards (Visa, Mastercard, American Express) and debit cards through Stripe. All payments are processed securely and we never store your payment information.',
    category: 'payments',
    tags: ['payment', 'stripe', 'security'],
    priority: 2,
    visible: true,
    lastUpdated: '2024-01-15',
  },
  {
    id: 'shipping-information',
    title: 'Shipping and delivery',
    content:
      'Distance-based shipping starts at $3.99 (domestic), $7.99 (regional), $14.99 (international). Free shipping on orders $35+/$50+/$75+ respectively. Sellers ship within 4 days. Delivery: 3-7 days (domestic), 5-10 (regional), 10-21 (international).',
    category: 'shipping',
    tags: ['shipping', 'delivery', 'rates', 'international'],
    priority: 2,
    visible: true,
    lastUpdated: '2024-01-15',
  },
  {
    id: 'account-verification',
    title: 'Account verification',
    content:
      'To sell books, you need to verify your account by providing a valid email address and completing your profile. This helps build trust with buyers and ensures secure transactions.',
    category: 'account',
    tags: ['verification', 'profile', 'trust'],
    priority: 2,
    visible: true,
    lastUpdated: '2024-01-15',
  },
  {
    id: 'forgot-password',
    title: 'I forgot my password',
    content:
      "Click 'Forgot Password' on the login page and enter your email address. You'll receive a reset link in your email. If you don't see the email, check your spam folder.",
    category: 'troubleshooting',
    tags: ['password', 'reset', 'login'],
    priority: 3,
    visible: true,
    lastUpdated: '2024-01-15',
  },
  {
    id: 'book-not-arrived',
    title: "My book hasn't arrived",
    content:
      "If your book hasn't arrived within the expected timeframe, please contact support with your order number. We'll help track your package and resolve any delivery issues.",
    category: 'troubleshooting',
    tags: ['delivery', 'tracking', 'support'],
    priority: 3,
    visible: true,
    lastUpdated: '2024-01-15',
  },
];

export class HelpSystemManager {
  private items: HelpItem[];
  private categories: HelpCategory[];
  private searchIndex: Map<string, string[]>;

  constructor() {
    this.items = [...DEFAULT_HELP_ITEMS];
    this.categories = [...HELP_CATEGORIES];
    this.searchIndex = new Map();
    this.buildSearchIndex();
  }

  private buildSearchIndex(): void {
    this.items.forEach(item => {
      const searchableText = [
        item.title,
        item.content,
        ...item.tags,
        item.category,
      ]
        .join(' ')
        .toLowerCase();

      const words = searchableText.split(/\s+/);
      words.forEach(word => {
        if (word.length > 2) {
          if (!this.searchIndex.has(word)) {
            this.searchIndex.set(word, []);
          }
          this.searchIndex.get(word)!.push(item.id);
        }
      });
    });
  }

  getItems(category?: string): HelpItem[] {
    if (category) {
      return this.items.filter(
        item => item.category === category && item.visible
      );
    }
    return this.items.filter(item => item.visible);
  }

  getItem(id: string): HelpItem | undefined {
    return this.items.find(item => item.id === id);
  }

  getCategories(): HelpCategory[] {
    return this.categories.map(category => ({
      ...category,
      items: this.getItems(category.id).map(item => item.id),
    }));
  }

  getCategory(id: string): HelpCategory | undefined {
    return this.categories.find(category => category.id === id);
  }

  search(query: string, limit: number = 10): HelpSearchResult[] {
    if (!query.trim()) return [];

    const searchTerms = query.toLowerCase().split(/\s+/);
    const itemScores = new Map<
      string,
      { score: number; matchedFields: string[] }
    >();

    searchTerms.forEach(term => {
      if (term.length <= 2) return;

      const matchingItems = this.searchIndex.get(term) || [];
      matchingItems.forEach(itemId => {
        const item = this.getItem(itemId);
        if (!item) return;

        const current = itemScores.get(itemId) || {
          score: 0,
          matchedFields: [],
        };

        // Score based on where the term appears
        if (item.title.toLowerCase().includes(term)) {
          current.score += 10;
          current.matchedFields.push('title');
        }
        if (item.content.toLowerCase().includes(term)) {
          current.score += 5;
          current.matchedFields.push('content');
        }
        if (item.tags.some(tag => tag.toLowerCase().includes(term))) {
          current.score += 3;
          current.matchedFields.push('tags');
        }
        if (item.category.toLowerCase().includes(term)) {
          current.score += 2;
          current.matchedFields.push('category');
        }

        itemScores.set(itemId, current);
      });
    });

    return Array.from(itemScores.entries())
      .map(([itemId, data]) => ({
        item: this.getItem(itemId)!,
        score: data.score,
        matchedFields: [...new Set(data.matchedFields)],
      }))
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  getContextualHelp(context: HelpContext): HelpItem[] {
    const { page, userType } = context;

    let relevantItems: HelpItem[] = [];

    // Filter by page context
    if (page === 'signup' || page === 'login') {
      relevantItems = this.getItems('getting-started');
    } else if (page === 'checkout' || page === 'cart') {
      relevantItems = this.getItems('buying').concat(this.getItems('payments'));
    } else if (page === 'sell' || page === 'dashboard') {
      relevantItems = this.getItems('selling').concat(this.getItems('account'));
    } else if (page === 'profile' || page === 'settings') {
      relevantItems = this.getItems('account');
    }

    // Filter by user type
    if (userType === 'buyer') {
      relevantItems = relevantItems.filter(
        item =>
          item.category === 'buying' ||
          item.category === 'payments' ||
          item.category === 'shipping'
      );
    } else if (userType === 'seller') {
      relevantItems = relevantItems.filter(
        item =>
          item.category === 'selling' ||
          item.category === 'account' ||
          item.category === 'payments'
      );
    }

    // Sort by priority and relevance
    return relevantItems.sort((a, b) => a.priority - b.priority).slice(0, 5);
  }

  addItem(item: Omit<HelpItem, 'id' | 'lastUpdated'>): string {
    const id = `help_${Date.now()}`;
    const newItem: HelpItem = {
      ...item,
      id,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    this.items.push(newItem);
    this.buildSearchIndex();
    return id;
  }

  updateItem(id: string, updates: Partial<HelpItem>): boolean {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items[index] = {
        ...this.items[index],
        ...updates,
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      this.buildSearchIndex();
      return true;
    }
    return false;
  }

  deleteItem(id: string): boolean {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items.splice(index, 1);
      this.buildSearchIndex();
      return true;
    }
    return false;
  }

  getPopularItems(limit: number = 5): HelpItem[] {
    // In a real implementation, this would be based on actual usage data
    return this.items
      .filter(item => item.visible)
      .sort((a, b) => a.priority - b.priority)
      .slice(0, limit);
  }

  getRelatedItems(itemId: string, limit: number = 3): HelpItem[] {
    const item = this.getItem(itemId);
    if (!item) return [];

    return this.items
      .filter(
        otherItem =>
          otherItem.id !== itemId &&
          otherItem.visible &&
          (otherItem.category === item.category ||
            otherItem.tags.some(tag => item.tags.includes(tag)))
      )
      .sort((a, b) => a.priority - b.priority)
      .slice(0, limit);
  }

  getFrequentlyAskedQuestions(): HelpItem[] {
    return this.items
      .filter(item => item.visible && item.priority <= 2)
      .sort((a, b) => a.priority - b.priority);
  }

  getQuickStartGuide(): HelpItem[] {
    return this.getItems('getting-started')
      .filter(item => item.priority === 1)
      .sort((a, b) => a.title.localeCompare(b.title));
  }
}

// Singleton instance
export const helpSystemManager = new HelpSystemManager();

// Utility functions
export function getHelpItems(category?: string): HelpItem[] {
  return helpSystemManager.getItems(category);
}

export function getHelpItem(id: string): HelpItem | undefined {
  return helpSystemManager.getItem(id);
}

export function searchHelp(query: string, limit?: number): HelpSearchResult[] {
  return helpSystemManager.search(query, limit);
}

export function getContextualHelp(context: HelpContext): HelpItem[] {
  return helpSystemManager.getContextualHelp(context);
}

export function getPopularHelpItems(limit?: number): HelpItem[] {
  return helpSystemManager.getPopularItems(limit);
}

export function getRelatedHelpItems(
  itemId: string,
  limit?: number
): HelpItem[] {
  return helpSystemManager.getRelatedItems(itemId, limit);
}

export function getFrequentlyAskedQuestions(): HelpItem[] {
  return helpSystemManager.getFrequentlyAskedQuestions();
}

export function getQuickStartGuide(): HelpItem[] {
  return helpSystemManager.getQuickStartGuide();
}

// Help context helpers
export function createHelpContext(
  page: string,
  section?: string,
  action?: string,
  userType?: 'buyer' | 'seller' | 'guest'
): HelpContext {
  return { page, section, action, userType };
}

export function getHelpForPage(page: string): HelpItem[] {
  return getContextualHelp(createHelpContext(page));
}

export function getHelpForAction(page: string, action: string): HelpItem[] {
  return getContextualHelp(createHelpContext(page, undefined, action));
}
