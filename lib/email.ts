/**
 * Email Sending Utilities
 * Unified interface for transactional emails
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@m4ktaba.com';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping email send');
    return;
  }

  try {
    if (!options.html && !options.text) {
      throw new Error('sendEmail requires either html or text content');
    }

    const htmlBody =
      options.html ?? (options.text ? `<pre>${options.text}</pre>` : undefined);
    const textBody =
      options.text ?? stripHtml(options.html ?? '');

    const payload: {
      from: string;
      to: string[];
      subject: string;
      text: string;
      html?: string;
    } = {
      from: FROM_EMAIL,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      text: textBody,
    };

    if (htmlBody) {
      payload.html = htmlBody;
    }

    await resend.emails.send(payload);

    console.log(`✉️  Email sent to: ${options.to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

/**
 * Send order confirmation email to buyer
 */
export async function sendOrderConfirmationEmail(
  email: string,
  orderId: string,
  details: { amount: number; currency: string }
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Order Confirmation - ${orderId}`,
    html: `
      <h2>Thank you for your order!</h2>
      <p>Your order <strong>${orderId}</strong> has been confirmed.</p>
      <p><strong>Amount:</strong> ${details.amount.toFixed(2)} ${details.currency}</p>
      <p>We'll send you another email when your order ships.</p>
      <p>Best regards,<br/>M4KTABA Team</p>
    `,
    text: `Thank you for your order! Your order ${orderId} has been confirmed. Amount: ${details.amount.toFixed(2)} ${details.currency}. We'll send you another email when your order ships.`,
  });
}

/**
 * Send payment failed email to buyer
 */
export async function sendPaymentFailedEmail(
  email: string,
  orderId: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Payment Failed - ${orderId}`,
    html: `
      <h2>Payment Failed</h2>
      <p>Unfortunately, your payment for order <strong>${orderId}</strong> could not be processed.</p>
      <p>Please try again or use a different payment method.</p>
      <p>If you continue to experience issues, please contact our support team.</p>
      <p>Best regards,<br/>M4KTABA Team</p>
    `,
    text: `Payment Failed. Unfortunately, your payment for order ${orderId} could not be processed. Please try again or use a different payment method.`,
  });
}

/**
 * Send refund confirmation email
 */
export async function sendRefundConfirmationEmail(
  email: string,
  orderId: string,
  details: { refundAmount: number; currency: string }
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Refund Processed - ${orderId}`,
    html: `
      <h2>Refund Processed</h2>
      <p>A refund has been processed for order <strong>${orderId}</strong>.</p>
      <p><strong>Refund Amount:</strong> ${details.refundAmount.toFixed(2)} ${details.currency}</p>
      <p>The refund should appear in your account within 5-10 business days.</p>
      <p>Best regards,<br/>M4KTABA Team</p>
    `,
    text: `Refund Processed. A refund of ${details.refundAmount.toFixed(2)} ${details.currency} has been processed for order ${orderId}. The refund should appear in your account within 5-10 business days.`,
  });
}

/**
 * Notify seller about order events
 */
export async function notifySeller(
  sellerId: string,
  event: 'new_order' | 'order_refunded' | 'dispute_created',
  data: Record<string, string>
): Promise<void> {
  // TODO: Get seller email from database
  // const sellerEmail = await getSellerEmail(sellerId);
  
  console.log(`Notifying seller ${sellerId} about ${event}`, data);
  
  // For now, just log. Implement full email when seller database is ready
  if (event === 'new_order') {
    // await sendEmail({
    //   to: sellerEmail,
    //   subject: 'New Order Received',
    //   html: `<h2>You have a new order!</h2><p>Order ID: ${data.orderId}</p>`,
    //   text: `You have a new order! Order ID: ${data.orderId}`,
    // });
  }
}

/**
 * Notify admin about critical events
 */
export async function notifyAdmin(
  event: string,
  data: Record<string, any>
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.ALERT_EMAIL;

  if (!adminEmail) {
    console.warn('No admin email configured');
    return;
  }

  // Determine if this is an error report
  const isErrorReport = event.includes('Error:') || data.type === 'react_error' || data.type === 'javascript_error';

  const subject = isErrorReport
    ? `🚨 M4KTABA Error: ${event}`
    : `Admin Alert: ${event}`;

  const html = isErrorReport ? generateErrorReportHtml(event, data) : generateAdminAlertHtml(event, data);

  await sendEmail({
    to: adminEmail,
    subject,
    html,
    text: isErrorReport ? generateErrorReportText(event, data) : generateAdminAlertText(event, data),
  });
}

function generateErrorReportHtml(event: string, data: Record<string, any>): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #dc3545;">🚨 Error Report</h1>
      <p><strong>Event:</strong> ${event}</p>
      <p><strong>Timestamp:</strong> ${data.timestamp || new Date().toISOString()}</p>
      <p><strong>URL:</strong> ${data.url || 'Unknown'}</p>
      <p><strong>User Agent:</strong> ${data.userAgent || 'Unknown'}</p>

      ${data.userId ? `<p><strong>User ID:</strong> ${data.userId}</p>` : ''}
      ${data.userEmail ? `<p><strong>User Email:</strong> ${data.userEmail}</p>` : ''}

      <h3>Error Details</h3>
      <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545; margin: 10px 0;">
        <p><strong>Message:</strong> ${data.error || data.message}</p>
        ${data.stack ? `<p><strong>Stack:</strong></p><pre style="white-space: pre-wrap; font-size: 12px;">${data.stack}</pre>` : ''}
        ${data.componentStack ? `<p><strong>Component Stack:</strong></p><pre style="white-space: pre-wrap; font-size: 12px;">${data.componentStack}</pre>` : ''}
      </div>

      <h3>Additional Data</h3>
      <pre style="background: #f8f9fa; padding: 10px; font-size: 12px;">${JSON.stringify(data.additionalData || data, null, 2)}</pre>
    </div>
  `;
}

function generateErrorReportText(event: string, data: Record<string, any>): string {
  return `
🚨 ERROR REPORT
Event: ${event}
Timestamp: ${data.timestamp || new Date().toISOString()}
URL: ${data.url || 'Unknown'}
User Agent: ${data.userAgent || 'Unknown'}
${data.userId ? `User ID: ${data.userId}` : ''}
${data.userEmail ? `User Email: ${data.userEmail}` : ''}

Error Details:
Message: ${data.error || data.message}
${data.stack ? `Stack:\n${data.stack}` : ''}
${data.componentStack ? `Component Stack:\n${data.componentStack}` : ''}

Additional Data:
${JSON.stringify(data.additionalData || data, null, 2)}
  `.trim();
}

function generateAdminAlertHtml(event: string, data: Record<string, any>): string {
  return `
    <h2>Admin Alert</h2>
    <p><strong>Event:</strong> ${event}</p>
    <pre>${JSON.stringify(data, null, 2)}</pre>
  `;
}

function generateAdminAlertText(event: string, data: Record<string, any>): string {
  return `Admin Alert: ${event}\n\n${JSON.stringify(data, null, 2)}`;
}

type OrderEmailPayload = {
  _id: string;
  items: Array<{
    title?: string;
    quantity?: number;
    price?: number;
  }>;
  total?: number;
  shippingDetails?: {
    name?: string;
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  createdAt?: string;
};

function renderItemsList(items: OrderEmailPayload['items'] = []): string {
  if (!items.length) return '<p>No items listed.</p>';
  return `
    <ul>
      ${items
        .map(
          (item) => `
        <li>
          <strong>${item.title ?? 'Item'}</strong> × ${item.quantity ?? 1}
          — $${((item.price ?? 0) * (item.quantity ?? 1)).toFixed(2)}
        </li>
      `
        )
        .join('')}
    </ul>
  `;
}

function renderShippingDetails(details: OrderEmailPayload['shippingDetails']) {
  if (!details) return '<p>Shipping details not available yet.</p>';
  return `
    <p>
      ${details.name ?? ''}
      <br />${details.street1 ?? ''}
      ${details.street2 ? `<br />${details.street2}` : ''}
      <br />${details.city ?? ''}, ${details.state ?? ''} ${details.zip ?? ''}
      <br />${details.country ?? ''}
    </p>
  `;
}

export const emailTemplates = {
  orderConfirmation(order: OrderEmailPayload) {
    const html = `
      <h2>Thank you for your order!</h2>
      <p>Your order <strong>${order._id}</strong> has been confirmed.</p>
      <p><strong>Total:</strong> $${(order.total ?? 0).toFixed(2)}</p>
      <h3>Items</h3>
      ${renderItemsList(order.items)}
      <h3>Shipping Details</h3>
      ${renderShippingDetails(order.shippingDetails)}
      <p>We'll let you know as soon as your items ship.</p>
      <p>— M4KTABA Team</p>
    `;

    return {
      subject: `Order Confirmation – ${order._id}`,
      html,
      text: stripHtml(html),
    };
  },

  newOrderNotification(order: OrderEmailPayload) {
    const html = `
      <h2>New Order Received</h2>
      <p>You have a new order <strong>${order._id}</strong> ready to fulfill.</p>
      <p><strong>Total:</strong> $${(order.total ?? 0).toFixed(2)}</p>
      <h3>Items</h3>
      ${renderItemsList(order.items)}
      <h3>Shipping Address</h3>
      ${renderShippingDetails(order.shippingDetails)}
      <p>Please prepare the items for shipment.</p>
      <p>— M4KTABA Marketplace</p>
    `;

    return {
      subject: `New Order ${order._id}`,
      html,
      text: stripHtml(html),
    };
  },

  shippingUpdate(
    order: OrderEmailPayload,
    trackingNumber?: string | null,
    carrier?: string | null
  ) {
    const trackingInfo = trackingNumber
      ? `<p><strong>Tracking:</strong> ${trackingNumber}${
          carrier ? ` via ${carrier}` : ''
        }</p>`
      : '<p>Tracking information will be shared once available.</p>';

    const html = `
      <h2>Your Order is on the Way!</h2>
      <p>Order <strong>${order._id}</strong> has been shipped.</p>
      ${trackingInfo}
      <h3>Shipping To</h3>
      ${renderShippingDetails(order.shippingDetails)}
      <h3>Items</h3>
      ${renderItemsList(order.items)}
      <p>Thank you for shopping with M4KTABA.</p>
    `;

    return {
      subject: `Shipping Update – Order ${order._id}`,
      html,
      text: stripHtml(html),
    };
  },
};
