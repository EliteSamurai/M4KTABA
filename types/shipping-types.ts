export interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  weight?: number; // weight in lbs
  user: {
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
  _id: number;
  title: string;
  user: User;
  quantity?: number;
  image: string;
  sales: number;
  price: number;
  _createdAt?: string | number;
};
