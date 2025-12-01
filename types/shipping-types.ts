export interface CartItem {
  _key?: string; // Sanity array item key
  id: string;
  title: string;
  author?: string; // Book author
  price: number;
  quantity: number;
  weight?: number; // weight in lbs
  shippingStatus?: string;
  refundDetails?: {
    refundStatus?: string;
  };
  user?: {
    name?: string;
    location?: {
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
    };
    email?: string;
    stripeAccountId?: string;
    _id?: string;
  };
}

export interface FedExAddress {
  city: string;
  stateOrProvinceCode: string;
  postalCode: string;
  countryCode: string; // Use ISO 3166-1 alpha-2 country code, e.g., "US"
}

export interface User {
  _id: string;
  email: string;
  name: string;
  stripeAccountId: string;
  cart?: CartItem[];
  location?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    stripeAccountId: string;
  };
}

export type Book = {
  _id: string;
  title: string;
  author: string;
  user: User;
  quantity?: number;
  image: string;
  sales: number;
  price: number;
  selectedCategory: { _ref: string; title: string };
  _createdAt?: string | number;
};

// Shipping tier types
export type ShippingTier = 'domestic' | 'regional' | 'international';

export interface ShippingCalculation {
  tier: ShippingTier;
  buyerPays: number;
  sellerPays: number;
  platformSubsidy: number;
  actualCost: number;
  estimatedDays: { min: number; max: number };
  carrier: string;
  note?: string;
}

export interface ShippingAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  zip?: string;
  country: string;
}
