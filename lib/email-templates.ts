export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface OrderEmailData {
  orderId: string;
  customerName: string;
  orderTotal: number;
  trackingNumber?: string;
  estimatedDelivery?: string;
  items: Array<{
    title: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

export function getOrderConfirmationTemplate(
  data: OrderEmailData
): EmailTemplate {
  return {
    subject: `Order Confirmed - #${data.orderId}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6;">
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #2c3e50; margin: 0;">Order Confirmed! 🎉</h1>
        </div>
        
        <div style="padding: 20px; background: white; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p>Hi ${data.customerName},</p>
          <p>Thank you for your purchase! Your order has been confirmed and is being processed.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #2c3e50; margin-top: 0;">Order #${data.orderId}</h2>
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <strong>Total:</strong>
              <span>$${data.orderTotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <strong>Status:</strong>
              <span style="color: #28a745;">Confirmed</span>
            </div>
          </div>
          
          <h3 style="color: #2c3e50;">Items Ordered:</h3>
          <div style="margin: 20px 0;">
            ${data.items
              .map(
                item => `
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                <div>
                  <strong>${item.title}</strong><br>
                  <small>Qty: ${item.quantity}</small>
                </div>
                <div>$${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            `
              )
              .join('')}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${data.orderId}" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Track Your Order
            </a>
          </div>
          
          <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
            If you have any questions, please contact us at support@m4ktaba.com
          </p>
        </div>
      </div>
    `,
    text: `
Order Confirmed - #${data.orderId}

Hi ${data.customerName},

Thank you for your purchase! Your order has been confirmed and is being processed.

Order #${data.orderId}
Total: $${data.orderTotal.toFixed(2)}
Status: Confirmed

Items Ordered:
${data.items.map(item => `- ${item.title} (Qty: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`).join('\n')}

Track your order: ${process.env.NEXT_PUBLIC_APP_URL}/orders/${data.orderId}

If you have any questions, please contact us at support@m4ktaba.com
    `,
  };
}

export function getShippingUpdateTemplate(data: OrderEmailData): EmailTemplate {
  return {
    subject: `Your Order is on the way! - #${data.orderId}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6;">
        <div style="background: #e3f2fd; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #1976d2; margin: 0;">🚚 Your Order is on the way!</h1>
        </div>
        
        <div style="padding: 20px; background: white; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p>Hi ${data.customerName},</p>
          <p>Great news! Your order has been shipped and is on its way to you.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #2c3e50; margin-top: 0;">Order #${data.orderId}</h2>
            ${
              data.trackingNumber
                ? `
              <div style="margin: 10px 0;">
                <strong>Tracking Number:</strong> ${data.trackingNumber}
              </div>
            `
                : ''
            }
            ${
              data.estimatedDelivery
                ? `
              <div style="margin: 10px 0;">
                <strong>Estimated Delivery:</strong> ${data.estimatedDelivery}
              </div>
            `
                : ''
            }
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${data.orderId}" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Track Your Order
            </a>
          </div>
          
          <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
            If you have any questions, please contact us at support@m4ktaba.com
          </p>
        </div>
      </div>
    `,
    text: `
Your Order is on the way! - #${data.orderId}

Hi ${data.customerName},

Great news! Your order has been shipped and is on its way to you.

Order #${data.orderId}
${data.trackingNumber ? `Tracking Number: ${data.trackingNumber}` : ''}
${data.estimatedDelivery ? `Estimated Delivery: ${data.estimatedDelivery}` : ''}

Track your order: ${process.env.NEXT_PUBLIC_APP_URL}/orders/${data.orderId}

If you have any questions, please contact us at support@m4ktaba.com
    `,
  };
}

export function getDeliveryConfirmationTemplate(
  data: OrderEmailData
): EmailTemplate {
  return {
    subject: `Order Delivered - How was it? - #${data.orderId}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6;">
        <div style="background: #e8f5e8; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #2e7d32; margin: 0;">📦 Order Delivered!</h1>
        </div>
        
        <div style="padding: 20px; background: white; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p>Hi ${data.customerName},</p>
          <p>Your order has been delivered! We hope you love your new books.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #2c3e50; margin-top: 0;">Order #${data.orderId}</h2>
            <p>Thank you for choosing M4KTABA for your book needs!</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${data.orderId}/review" 
               style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-right: 10px;">
              Leave a Review
            </a>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/all" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Shop More Books
            </a>
          </div>
          
          <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
            If you have any questions, please contact us at support@m4ktaba.com
          </p>
        </div>
      </div>
    `,
    text: `
Order Delivered - How was it? - #${data.orderId}

Hi ${data.customerName},

Your order has been delivered! We hope you love your new books.

Order #${data.orderId}
Thank you for choosing M4KTABA for your book needs!

Leave a review: ${process.env.NEXT_PUBLIC_APP_URL}/orders/${data.orderId}/review
Shop more books: ${process.env.NEXT_PUBLIC_APP_URL}/all

If you have any questions, please contact us at support@m4ktaba.com
    `,
  };
}

