import { createTransport } from 'nodemailer';

export interface OrderItem {
  title: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  items: OrderItem[];
  total?: number;
  createdAt?: string;
  shippingDetails?: {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  // Check if SMTP is configured
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  console.log('📧 SMTP Configuration check:', {
    hasHost: !!smtpHost,
    hasPort: !!smtpPort,
    hasUser: !!smtpUser,
    hasPass: !!smtpPass,
    host: smtpHost,
    port: smtpPort,
    user: smtpUser,
  });

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.log('📧 SMTP not configured, logging email instead:');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML:', html.substring(0, 200) + '...');
    return;
  }

  try {
    const transporter = createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: parseInt(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.verify();
    console.log('📧 SMTP connection verified');

    const result = await transporter.sendMail({
      from: smtpUser,
      to,
      subject,
      html,
    });

    console.log('📧 Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

// Email templates
const orderConfirmation = (order: Order) => ({
    subject: `Order Confirmation - ${order._id}`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 32px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">🎉 Order Confirmed!</h1>
          <p style="margin: 8px 0 0 0; color: #cbd5e1; font-size: 16px;">Thank you for your purchase</p>
        </div>

        <!-- Content -->
        <div style="padding: 32px;">

          <!-- Order Summary -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 16px 0; color: #1e293b; font-size: 18px; font-weight: 600;">Order Summary</h3>
            <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">Order #${order._id.slice(-8)}</p>
            <p style="margin: 0 0 16px 0; color: #64748b; font-size: 14px;">Placed on ${new Date().toLocaleDateString()}</p>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 16px;">
            ${order.items
              .map(
                item =>
                  '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">' +
                  '<div>' +
                  '<p style="margin: 0; color: #1e293b; font-weight: 600;">' +
                  item.title +
                  '</p>' +
                  '<p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Quantity: ' +
                  item.quantity +
                  '</p>' +
                  '</div>' +
                  '<p style="margin: 0; color: #1e293b; font-weight: 600;">$' +
                  item.price.toFixed(2) +
                  '</p>' +
                  '</div>'
              )
              .join('')}

              <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <p style="margin: 0; color: #1e293b; font-weight: 600; font-size: 18px;">Total</p>
                  <p style="margin: 0; color: #1e293b; font-weight: 700; font-size: 18px;">$${(order.total || 0).toFixed(2)}</p>
        </div>
        </div>
      </div>
        </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://m4ktaba.com'}/orders/${order._id}"
               style="display: inline-block; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              Track Your Order
            </a>
        </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">Thank you for choosing M4KTABA!</p>
            <p style="margin: 0; color: #64748b; font-size: 14px;">If you have any questions, please contact us at <a href="mailto:contact@m4ktaba.com" style="color: #1e293b; text-decoration: none;">contact@m4ktaba.com</a></p>
          </div>

        </div>
      </div>
    </body>
    </html>
    `,
});

const newOrderNotification = (order: Order, sellerName: string) => ({
    subject: `New Order Received - ${order._id}`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Order Notification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">🛒 New Order!</h1>
          <p style="margin: 8px 0 0 0; color: #d1fae5; font-size: 16px;">You have a new order to fulfill</p>
        </div>

        <!-- Content -->
        <div style="padding: 32px;">

          <!-- Order Summary -->
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 16px 0; color: #14532d; font-size: 18px; font-weight: 600;">Order Details</h3>
            <p style="margin: 0 0 8px 0; color: #365314; font-size: 14px;">Order #${order._id.slice(-8)}</p>
            <p style="margin: 0 0 16px 0; color: #365314; font-size: 14px;">Received on ${new Date().toLocaleDateString()}</p>

            <div style="border-top: 1px solid #bbf7d0; padding-top: 16px;">
            ${order.items
              .map(
                item =>
                  '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">' +
                  '<div>' +
                  '<p style="margin: 0; color: #14532d; font-weight: 600;">' +
                  item.title +
                  '</p>' +
                  '<p style="margin: 4px 0 0 0; color: #365314; font-size: 14px;">Quantity: ' +
                  item.quantity +
                  '</p>' +
                  '</div>' +
                  '<p style="margin: 0; color: #14532d; font-weight: 600;">$' +
                  item.price.toFixed(2) +
                  '</p>' +
                  '</div>'
              )
              .join('')}

              <div style="border-top: 1px solid #bbf7d0; padding-top: 12px; margin-top: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <p style="margin: 0; color: #14532d; font-weight: 600; font-size: 18px;">Total</p>
                  <p style="margin: 0; color: #14532d; font-weight: 700; font-size: 18px;">$${(order.total || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Shipping Details -->
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 16px 0; color: #14532d; font-size: 18px; font-weight: 600;">📦 Shipping Address</h3>
            ${
              order.shippingDetails
                ? '<div style="color: #14532d;">' +
                  '<p style="margin: 0 0 8px 0; font-weight: 600;">' +
                  order.shippingDetails.name +
                  '</p>' +
                  '<p style="margin: 0 0 4px 0;">' +
                  order.shippingDetails.street1 +
                  '</p>' +
                  (order.shippingDetails.street2
                    ? '<p style="margin: 0 0 4px 0;">' +
                      order.shippingDetails.street2 +
                      '</p>'
                    : '') +
                  '<p style="margin: 0 0 4px 0;">' +
                  order.shippingDetails.city +
                  ', ' +
                  order.shippingDetails.state +
                  ' ' +
                  order.shippingDetails.zip +
                  '</p>' +
                  '<p style="margin: 0;">' +
                  order.shippingDetails.country +
                  '</p>' +
                  '</div>'
                : '<p style="margin: 0; color: #365314;">Shipping address will be provided separately</p>'
            }
        </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://m4ktaba.com'}/billing"
               style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              Manage Orders
            </a>
        </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">Thank you for selling on M4KTABA!</p>
            <p style="margin: 0; color: #64748b; font-size: 14px;">If you have any questions, please contact us at <a href="mailto:contact@m4ktaba.com" style="color: #1e293b; text-decoration: none;">contact@m4ktaba.com</a></p>
          </div>

        </div>
      </div>
    </body>
    </html>
    `,
});

export const shippingUpdate = (order: Order, trackingNumber?: string) => ({
  subject: `🚚 Your order has been shipped! ${trackingNumber ? `Tracking: ${trackingNumber}` : ''}`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Order Has Been Shipped</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 32px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">🚚 Order Shipped!</h1>
          <p style="margin: 8px 0 0 0; color: #cbd5e1; font-size: 16px;">Your order is on its way to you</p>
        </div>

        <!-- Content -->
        <div style="padding: 32px;">

          <!-- Shipping Info -->
          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #bae6fd; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="margin: 0 0 16px 0; color: #0c4a6e; font-size: 20px; font-weight: 600;">📦 Shipping Information</h2>
            ${
              trackingNumber
                ? '<div style="background: #ffffff; border-radius: 8px; padding: 16px; margin-bottom: 16px;">' +
                  '<p style="margin: 0 0 8px 0; color: #374151; font-weight: 600;">Tracking Number:</p>' +
                  '<p style="margin: 0; color: #1e293b; font-size: 18px; font-weight: 700; font-family: monospace; background: #f1f5f9; padding: 8px 12px; border-radius: 6px; display: inline-block;">' +
                  trackingNumber +
                  '</p>' +
                  '</div>'
                : ''
            }
            <p style="margin: 0; color: #0c4a6e; font-size: 15px;">Your order has been shipped and is on its way to you. Expected delivery: 3-5 business days.</p>
          </div>

          <!-- Order Summary -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 16px 0; color: #1e293b; font-size: 18px; font-weight: 600;">Order Summary</h3>
            <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">Order #${order._id.slice(-8)}</p>
            <p style="margin: 0 0 16px 0; color: #64748b; font-size: 14px;">Shipped on ${new Date().toLocaleDateString()}</p>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 16px;">
            ${order.items
              .map(
                item =>
                  '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">' +
                  '<div>' +
                  '<p style="margin: 0; color: #1e293b; font-weight: 600;">' +
                  item.title +
                  '</p>' +
                  '<p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Quantity: ' +
                  item.quantity +
                  '</p>' +
                  '</div>' +
                  '<p style="margin: 0; color: #1e293b; font-weight: 600;">$' +
                  item.price.toFixed(2) +
                  '</p>' +
                  '</div>'
              )
              .join('')}

              <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <p style="margin: 0; color: #1e293b; font-weight: 600; font-size: 18px;">Total</p>
                  <p style="margin: 0; color: #1e293b; font-weight: 700; font-size: 18px;">$${(order.total || 0).toFixed(2)}</p>
                </div>
        </div>
        </div>
      </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://m4ktaba.com'}/orders/${order._id}"
               style="display: inline-block; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              Track Your Order
            </a>
        </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">Thank you for choosing M4KTABA!</p>
            <p style="margin: 0; color: #64748b; font-size: 14px;">If you have any questions, please contact us at <a href="mailto:contact@m4ktaba.com" style="color: #1e293b; text-decoration: none;">contact@m4ktaba.com</a></p>
          </div>

        </div>
      </div>
    </body>
    </html>
  `,
});

export const emailTemplates = {
  orderConfirmation,
  newOrderNotification,
  shippingUpdate,
};
