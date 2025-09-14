import { Resend } from 'resend';

// Create a build-safe Resend client
function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey === 're_123') {
    // Return a mock client during build time
    return {
      emails: {
        send: async () => {
          throw new Error('Resend not configured - missing RESEND_API_KEY');
        },
      },
    } as unknown as Partial<Resend>;
  }

  return new Resend(apiKey);
}

const resend = createResendClient();

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface OrderItem {
  title: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  createdAt: string;
  items: OrderItem[];
  total: number;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const { data, error } = await (resend as any).emails.send({
      from: 'M4KTABA <orders@m4ktaba.com>',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

// Email templates
export const emailTemplates = {
  orderConfirmation: (order: Order) => ({
    subject: `Order Confirmation - ${order._id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Order Confirmation</h1>
        <p>Thank you for your order!</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h2 style="color: #444;">Order Details</h2>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          
          <h3 style="color: #555;">Items:</h3>
          <ul style="list-style: none; padding: 0;">
            ${order.items
              .map(
                (item: OrderItem) => `
              <li style="padding: 10px 0; border-bottom: 1px solid #eee;">
                ${item.title} - Quantity: ${item.quantity} - $${item.price.toFixed(2)}
              </li>
            `
              )
              .join('')}
          </ul>
          
          <p style="font-weight: bold; margin-top: 20px;">
            Total: $${order.total.toFixed(2)}
          </p>
        </div>

        <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h2 style="color: #444;">Shipping Details</h2>
          <p>${(order as any).shippingDetails.name}</p>
          <p>${(order as any).shippingDetails.street1}</p>
          ${(order as any).shippingDetails.street2 ? `<p>${(order as any).shippingDetails.street2}</p>` : ''}
          <p>${(order as any).shippingDetails.city}, ${(order as any).shippingDetails.state} ${(order as any).shippingDetails.zip}</p>
          <p>${(order as any).shippingDetails.country}</p>
        </div>

        <p>You will receive another email when your order ships.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            If you have any questions about your order, please contact us at support@m4ktaba.com
          </p>
        </div>
      </div>
    `,
  }),

  orderShipped: (order: Order) => ({
    subject: `Your Order Has Been Shipped - ${order._id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Order Shipped!</h1>
        <p>Great news! Your order has been shipped.</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h2 style="color: #444;">Order Details</h2>
          <p><strong>Order ID:</strong> ${order._id}</p>
          
          <h3 style="color: #555;">Items:</h3>
          <ul style="list-style: none; padding: 0;">
            ${order.items
              .map(
                (item: OrderItem) => `
              <li style="padding: 10px 0; border-bottom: 1px solid #eee;">
                ${item.title} - Quantity: ${item.quantity}
              </li>
            `
              )
              .join('')}
          </ul>
        </div>

        <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h2 style="color: #444;">Shipping Address</h2>
          <p>${(order as any).shippingDetails.name}</p>
          <p>${(order as any).shippingDetails.street1}</p>
          ${(order as any).shippingDetails.street2 ? `<p>${(order as any).shippingDetails.street2}</p>` : ''}
          <p>${(order as any).shippingDetails.city}, ${(order as any).shippingDetails.state} ${(order as any).shippingDetails.zip}</p>
          <p>${(order as any).shippingDetails.country}</p>
        </div>

        <p>Once you receive your order, please confirm delivery in your dashboard.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            If you have any questions about your order, please contact us at support@m4ktaba.com
          </p>
        </div>
      </div>
    `,
  }),

  newOrderNotification: (order: Order, sellerName: string) => ({
    subject: `New Order Received - ${order._id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">New Order Received</h1>
        <p>Hello ${sellerName},</p>
        <p>You have received a new order!</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h2 style="color: #444;">Order Details</h2>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          
          <h3 style="color: #555;">Items:</h3>
          <ul style="list-style: none; padding: 0;">
            ${order.items
              .map(
                (item: OrderItem) => `
              <li style="padding: 10px 0; border-bottom: 1px solid #eee;">
                ${item.title} - Quantity: ${item.quantity} - $${item.price.toFixed(2)}
              </li>
            `
              )
              .join('')}
          </ul>
          
          <p style="font-weight: bold; margin-top: 20px;">
            Total: $${order.total.toFixed(2)}
          </p>
        </div>

        <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h2 style="color: #444;">Shipping Details</h2>
          <p>${(order as any).shippingDetails.name}</p>
          <p>${(order as any).shippingDetails.street1}</p>
          ${(order as any).shippingDetails.street2 ? `<p>${(order as any).shippingDetails.street2}</p>` : ''}
          <p>${(order as any).shippingDetails.city}, ${(order as any).shippingDetails.state} ${(order as any).shippingDetails.zip}</p>
          <p>${(order as any).shippingDetails.country}</p>
        </div>

        <p>Please ship the items as soon as possible and mark the order as shipped in your dashboard.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            If you have any questions, please contact us at support@m4ktaba.com
          </p>
        </div>
      </div>
    `,
  }),

  orderDelivered: (order: Order, sellerName: string) => ({
    subject: `Order Delivered - ${order._id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Order Delivered</h1>
        <p>Hello ${sellerName},</p>
        <p>The buyer has confirmed delivery of the following order:</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h2 style="color: #444;">Order Details</h2>
          <p><strong>Order ID:</strong> ${order._id}</p>
          
          <h3 style="color: #555;">Items:</h3>
          <ul style="list-style: none; padding: 0;">
            ${order.items
              .map(
                (item: OrderItem) => `
              <li style="padding: 10px 0; border-bottom: 1px solid #eee;">
                ${item.title} - Quantity: ${item.quantity} - $${item.price.toFixed(2)}
              </li>
            `
              )
              .join('')}
          </ul>
        </div>

        <p>Thank you for your business!</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            If you have any questions, please contact us at support@m4ktaba.com
          </p>
        </div>
      </div>
    `,
  }),

  orderDisputed: (order: Order, sellerName: string) => ({
    subject: `Order Issue Reported - ${order._id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Order Issue Reported</h1>
        <p>Hello ${sellerName},</p>
        <p>The buyer has reported an issue with the following order:</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h2 style="color: #444;">Order Details</h2>
          <p><strong>Order ID:</strong> ${order._id}</p>
          
          <h3 style="color: #555;">Items:</h3>
          <ul style="list-style: none; padding: 0;">
            ${order.items
              .map(
                (item: OrderItem) => `
              <li style="padding: 10px 0; border-bottom: 1px solid #eee;">
                ${item.title} - Quantity: ${item.quantity} - $${item.price.toFixed(2)}
              </li>
            `
              )
              .join('')}
          </ul>
        </div>

        <p>Please review the order and contact the buyer to resolve the issue.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            If you need assistance, please contact us at support@m4ktaba.com
          </p>
        </div>
      </div>
    `,
  }),
};
