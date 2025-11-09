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
  html: string;
  text: string;
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
    await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

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

  await sendEmail({
    to: adminEmail,
    subject: `Admin Alert: ${event}`,
    html: `
      <h2>Admin Alert</h2>
      <p><strong>Event:</strong> ${event}</p>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    `,
    text: `Admin Alert: ${event}\n\n${JSON.stringify(data, null, 2)}`,
  });
}
