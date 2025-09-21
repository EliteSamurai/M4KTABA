export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export interface OrderTimeline {
  status: OrderStatus;
  timestamp: Date;
  description: string;
  trackingNumber?: string;
  notes?: string;
}

export interface OrderTrackingInfo {
  orderId: string;
  status: OrderStatus;
  timeline: OrderTimeline[];
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: Date;
  lastUpdated: Date;
}
