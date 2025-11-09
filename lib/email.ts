/**
 * Email Notification System
 * Handles sending emails via Resend API
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'M4KTABA <noreply@m4ktaba.com>';

/**
 * Send email using Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('RESEND_API_KEY not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: options.from || FROM_EMAIL,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Email send failed:', error);
      return false;
    }

    const data = await response.json();
    console.log('Email sent successfully:', data.id);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send order confirmation email to buyer
 */
export async function sendOrderConfirmationEmail(
  to: string,
  order: {
    orderId: string;
    items: Array<{ title: string; quantity: number; price: number }>;
    totalAmount: number;
    currency: string;
    shippingAddress: string;
  }
) {
  const itemsList = order.items
    .map(
      (item) =>
        `<li>${item.title} x${item.quantity} - ${formatCurrency(item.price * item.quantity, order.currency)}</li>`
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #10b981;">Order Confirmed! 🎉</h1>
          
          <p>Thank you for your order! We've received your payment and are processing your order.</p>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Order #${order.orderId}</h2>
            <ul style="padding-left: 20px;">
              ${itemsList}
            </ul>
            <p style="font-weight: bold; font-size: 18px; margin-top: 15px;">
              Total: ${formatCurrency(order.totalAmount, order.currency)}
            </p>
          </div>
          
          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
            <p style="margin: 0; color: #065f46;">
              <strong>💚 No Platform Fees</strong><br>
              100% of your payment goes to the seller minus only payment processor fees.
            </p>
          </div>
          
          <h3>Shipping Address</h3>
          <p>${order.shippingAddress}</p>
          
          <h3>What's Next?</h3>
          <p>
            1. The seller will prepare your order<br>
            2. You'll receive a shipping notification with tracking<br>
            3. Enjoy your books!
          </p>
          
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            If you have any questions, reply to this email or contact our support team.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="text-align: center; color: #6b7280; font-size: 12px;">
            M4KTABA - Your Global Islamic Book Marketplace<br>
            <a href="https://m4ktaba.com" style="color: #10b981;">m4ktaba.com</a>
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Order Confirmation - ${order.orderId}`,
    html,
    text: `Thank you for your order! Order #${order.orderId} - Total: ${formatCurrency(order.totalAmount, order.currency)}`,
  });
}

/**
 * Send new order notification to seller
 */
export async function sendNewOrderNotificationToSeller(
  to: string,
  order: {
    orderId: string;
    buyerName: string;
    items: Array<{ title: string; quantity: number; price: number }>;
    totalAmount: number;
    currency: string;
    netAmount: number;
  }
) {
  const itemsList = order.items
    .map(
      (item) =>
        `<li>${item.title} x${item.quantity} - ${formatCurrency(item.price * item.quantity, order.currency)}</li>`
    )
    .join('');

  const processorFee = order.totalAmount - order.netAmount;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Order Received</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #10b981;">New Order Received! 📦</h1>
          
          <p>You have a new order from <strong>${order.buyerName}</strong>!</p>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Order #${order.orderId}</h2>
            <ul style="padding-left: 20px;">
              ${itemsList}
            </ul>
          </div>
          
          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #065f46;">💰 Your Earnings</h3>
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td>Order Total:</td>
                <td style="text-align: right;">${formatCurrency(order.totalAmount, order.currency)}</td>
              </tr>
              <tr>
                <td>Platform Fee:</td>
                <td style="text-align: right; color: #10b981;"><strong>$0.00 (0%)</strong></td>
              </tr>
              <tr>
                <td>Payment Processor:</td>
                <td style="text-align: right;">-${formatCurrency(processorFee, order.currency)}</td>
              </tr>
              <tr style="border-top: 2px solid #10b981;">
                <td><strong>You Receive:</strong></td>
                <td style="text-align: right;"><strong>${formatCurrency(order.netAmount, order.currency)}</strong></td>
              </tr>
            </table>
          </div>
          
          <h3>Next Steps</h3>
          <p>
            1. Log in to your seller dashboard<br>
            2. Prepare the order for shipping<br>
            3. Mark as shipped and add tracking info
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://m4ktaba.com/dashboard/seller" 
               style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Order in Dashboard
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="text-align: center; color: #6b7280; font-size: 12px;">
            M4KTABA Seller Portal<br>
            <a href="https://m4ktaba.com" style="color: #10b981;">m4ktaba.com</a>
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `New Order - ${order.orderId}`,
    html,
    text: `New order received! Order #${order.orderId} - You'll receive ${formatCurrency(order.netAmount, order.currency)}`,
  });
}

/**
 * Send refund confirmation email
 */
export async function sendRefundConfirmationEmail(
  to: string,
  order: {
    orderId: string;
    refundAmount: number;
    currency: string;
    refundReason?: string;
  }
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Refund Processed</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #3b82f6;">Refund Processed</h1>
          
          <p>Your refund for order #${order.orderId} has been processed.</p>
          
          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <h3 style="margin-top: 0;">Refund Details</h3>
            <p><strong>Amount:</strong> ${formatCurrency(order.refundAmount, order.currency)}</p>
            ${order.refundReason ? `<p><strong>Reason:</strong> ${order.refundReason}</p>` : ''}
          </div>
          
          <p>
            The refund will appear in your account within 5-10 business days, depending on your payment method.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="text-align: center; color: #6b7280; font-size: 12px;">
            M4KTABA<br>
            <a href="https://m4ktaba.com" style="color: #10b981;">m4ktaba.com</a>
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Refund Processed - ${order.orderId}`,
    html,
    text: `Your refund of ${formatCurrency(order.refundAmount, order.currency)} for order #${order.orderId} has been processed.`,
  });
}

/**
 * Send payment failed notification
 */
export async function sendPaymentFailedEmail(
  to: string,
  order: {
    orderId: string;
    failureReason?: string;
  }
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Failed</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ef4444;">Payment Failed</h1>
          
          <p>Unfortunately, your payment for order #${order.orderId} could not be processed.</p>
          
          ${order.failureReason ? `
            <div style="background: #fee2e2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
              <p style="margin: 0;"><strong>Reason:</strong> ${order.failureReason}</p>
            </div>
          ` : ''}
          
          <h3>What to do next:</h3>
          <p>
            1. Check your payment method details<br>
            2. Ensure you have sufficient funds<br>
            3. Try placing the order again
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://m4ktaba.com/checkout" 
               style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Try Again
            </a>
          </div>
          
          <p>If you continue to experience issues, please contact our support team.</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="text-align: center; color: #6b7280; font-size: 12px;">
            M4KTABA<br>
            <a href="https://m4ktaba.com" style="color: #10b981;">m4ktaba.com</a>
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Payment Failed - ${order.orderId}`,
    html,
    text: `Your payment for order #${order.orderId} could not be processed. Please try again.`,
  });
}

/**
 * Format currency helper
 */
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}
