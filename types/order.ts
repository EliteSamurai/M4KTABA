export interface OrderItem {
  sellerId: string;
  title: string;
  price: number;
  quantity: number;
}

export interface ShippingDetails {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Order {
  _id: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'disputed';
  buyer: {
    _ref: string;
    email: string;
    name: string;
  };
  items: OrderItem[];
  shippingDetails: ShippingDetails;
  total: number;
  createdAt: string;
  updatedAt: string;
}
