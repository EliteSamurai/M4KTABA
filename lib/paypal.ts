/**
 * PayPal Integration for Global Marketplace
 * Supports international payments in multiple currencies
 * No platform fees - sellers receive full amount minus PayPal processing fees
 */

const PAYPAL_API_BASE =
  process.env.NODE_ENV === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

/**
 * Get PayPal OAuth access token
 */
export async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'PayPal credentials not configured. Set PAYPAL_CLIENT_ID and PAYPAL_SECRET environment variables.'
    );
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal auth failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

export interface PayPalOrderItem {
  name: string;
  description?: string;
  quantity: string;
  unit_amount: {
    currency_code: string;
    value: string;
  };
}

export interface CreatePayPalOrderParams {
  items: PayPalOrderItem[];
  totalAmount: string;
  currency: string;
  orderId: string;
  buyerEmail?: string;
  shippingAddress?: {
    name: string;
    address_line_1: string;
    address_line_2?: string;
    admin_area_2: string; // city
    admin_area_1: string; // state/province
    postal_code: string;
    country_code: string;
  };
}

/**
 * Create PayPal order
 */
export async function createPayPalOrder(
  params: CreatePayPalOrderParams
): Promise<{
  id: string;
  status: string;
  links: Array<{ href: string; rel: string }>;
}> {
  const accessToken = await getPayPalAccessToken();

  const requestBody = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: params.orderId,
        description: `M4KTABA Order ${params.orderId}`,
        custom_id: params.orderId,
        soft_descriptor: 'M4KTABA',
        amount: {
          currency_code: params.currency.toUpperCase(),
          value: params.totalAmount,
          breakdown: {
            item_total: {
              currency_code: params.currency.toUpperCase(),
              value: params.totalAmount,
            },
          },
        },
        items: params.items,
        ...(params.shippingAddress && {
          shipping: {
            name: {
              full_name: params.shippingAddress.name,
            },
            address: params.shippingAddress,
          },
        }),
      },
    ],
    application_context: {
      brand_name: 'M4KTABA',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/paypal/capture`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout`,
    },
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal order creation failed: ${error}`);
  }

  const order = await response.json();
  return order;
}

/**
 * Capture PayPal order (complete the payment)
 */
export async function capturePayPalOrder(orderId: string): Promise<{
  id: string;
  status: string;
  purchase_units: Array<{
    reference_id: string;
    payments: {
      captures: Array<{
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
      }>;
    };
  }>;
}> {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(
    `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal order capture failed: ${error}`);
  }

  const captureData = await response.json();
  return captureData;
}

/**
 * Get PayPal order details
 */
export async function getPayPalOrder(orderId: string): Promise<{
  id: string;
  status: string;
  purchase_units: Array<{
    reference_id: string;
    amount: {
      currency_code: string;
      value: string;
    };
  }>;
}> {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(
    `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal order fetch failed: ${error}`);
  }

  const order = await response.json();
  return order;
}

/**
 * Check if PayPal is configured
 */
export function isPayPalConfigured(): boolean {
  return !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_SECRET);
}

/**
 * Get supported PayPal currencies
 * PayPal supports 25+ currencies
 */
export const PAYPAL_SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'AUD',
  'CAD',
  'JPY',
  'CHF',
  'SEK',
  'NOK',
  'DKK',
  'PLN',
  'CZK',
  'HUF',
  'ILS',
  'MXN',
  'BRL',
  'MYR',
  'PHP',
  'TWD',
  'THB',
  'TRY', // Turkish Lira
  'NZD',
  'HKD',
  'SGD',
  'RUB',
] as const;

export type PayPalCurrency = (typeof PAYPAL_SUPPORTED_CURRENCIES)[number];

/**
 * Check if currency is supported by PayPal
 */
export function isPayPalCurrencySupported(currency: string): boolean {
  return PAYPAL_SUPPORTED_CURRENCIES.includes(
    currency.toUpperCase() as PayPalCurrency
  );
}

