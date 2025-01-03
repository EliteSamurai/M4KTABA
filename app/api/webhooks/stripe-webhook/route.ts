import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type { Stripe } from "stripe";
import { createTransport } from "nodemailer";
import { CartItem, User } from "@/types/shipping-types";
import { client } from "@/studio-m4ktaba/client";

export const config = {
  api: {
    bodyParser: false, // Stripe requires the raw body to construct the event
  },
};

async function getCartFromSanity(email: string): Promise<User | null> {
  try {
    const query = `*[_type == "user" && email == $email][0]`;
    const user: User | null = await client.fetch(query, { email });

    if (!user || !user.cart) {
      console.error(`No user or cart found for email: ${email}`);
      return null;
    }

    return user; // Return the full user object
  } catch (error) {
    console.error(`Error fetching user for email ${email}:`, error);
    return null;
  }
}

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const transporter = createTransport({
    service: "SMTP",
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Optional, useful for self-signed certs
    },
    debug: true,
  });

  await transporter.sendMail({
    from: `M4KTABA <contact@m4ktaba.com>`,
    to,
    subject,
    html,
  });

  console.log(`Email sent to ${to}`);
}

function generateBuyerEmailContent(
  items: CartItem[],
  shippingDetails: {
    name: string;
    street1: string;
    street2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  },
  orderId: string
) {
  const itemsHtml = items
    .map(
      (item) =>
        `<li>${item.title} - Quantity: ${item.quantity} - $${item.price.toFixed(2)}</li>`
    )
    .join("");

  const shippingAddress = `
    <p><strong>Shipping Address:</strong></p>
    <p>${shippingDetails.name}</p>
    <p>${shippingDetails.street1}</p>
    ${shippingDetails.street2 ? `<p>${shippingDetails.street2}</p>` : ""}
    <p>${shippingDetails.city}, ${shippingDetails.state}, ${shippingDetails.zip}</p>
    <p>${shippingDetails.country}</p>
  `;

  return `
    <h1>Order Confirmation</h1>
    <p>Thank you for your purchase! Your order has been received and is being processed. The seller has been notified and will ship your items as soon as possible.</p>
    
    <p><strong>Order Details:</strong></p>
    <ul>${itemsHtml}</ul>
    
    ${shippingAddress}
    
    <p><strong>Order ID:</strong> ${orderId}</p>
    
    <p>We appreciate your business and hope you enjoy your purchase. If you have any questions about your order, please feel free to contact us.</p>
    
    <p>Thank you for choosing our platform!</p>
  `;
}

// Generate email content for sellers
function generateSellerEmailContent(
  items: CartItem[],
  shippingDetails: {
    name: string;
    street1: string;
    street2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  },
  paymentIntentId: string,
  sellerPayout?: number
) {
  const itemsHtml = items
    .map(
      (item) =>
        `<li>${item.title} - Quantity: ${item.quantity} - $${item.price.toFixed(2)}</li>`
    )
    .join("");

  const itemLinks = items
    .map(
      (item) => `
      <p>
        <strong>Item:</strong> ${item.title} <br/>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/confirm-shipment?orderId=${paymentIntentId}&itemId=${item.id}" 
          style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; text-align: center;">
          Confirm Shipment for This Item
        </a>
      </p>
    `
    )
    .join("");

  const shippingAddress = `
    <p><strong>Shipping Details:</strong></p>
    <p>${shippingDetails.name}</p>
    <p>${shippingDetails.street1}</p>
    ${shippingDetails.street2 ? `<p>${shippingDetails.street2}</p>` : ""}
    <p>${shippingDetails.city}, ${shippingDetails.state}, ${shippingDetails.zip}</p>
    <p>${shippingDetails.country}</p>
  `;

  return `
  <h1>New Order Received</h1>
  <p>Congratulations! You have received a new order. Please find the details below:</p>
  
  <p><strong>Order Summary:</strong></p>
  <ul>${itemsHtml}</ul>
  
  ${
    sellerPayout
      ? `<p><strong>Total Payout to You:</strong> $${sellerPayout.toFixed(2)}</p>
         <p>The amount has been adjusted for platform fees and will be transferred to your Stripe account.</p>`
      : ""
  }
  
  ${shippingAddress ? `<p><strong>Shipping Address:</strong><br/>${shippingAddress}</p>` : ""}
  
  <p><strong>Order ID:</strong> ${paymentIntentId}</p>
  
  <p>Please ship the items to the buyer at the address provided above. Once shipped, ensure you update by clicking the link below.</p>

  ${itemLinks}
  
  <p>If you have any questions, feel free to contact our support team.</p>
  
  <p>Thank you for using our platform!</p>
`;
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error("Missing Stripe signature or webhook secret.");
    return NextResponse.json(
      { error: "Missing Stripe signature or webhook secret." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const payload = await req.text();
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (error: any) {
    console.error("Webhook signature verification failed:", error.message);
    return NextResponse.json(
      { error: "Webhook signature verification failed." },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          req,
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case "charge.dispute.created":
        await handleChargeDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      case "charge.dispute.updated":
        await handleChargeDisputeUpdated(event.data.object as Stripe.Dispute);
        break;

      // Add more event types as needed

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error handling webhook event:", error.message);
    return NextResponse.json(
      { error: "Webhook handler error." },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(
  req: Request,
  paymentIntent: Stripe.PaymentIntent
) {
  try {
    const userEmail = paymentIntent.metadata.userEmail;
    const shippingDetails: {
      name: string;
      street1: string;
      street2: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    } = paymentIntent.metadata.shippingDetails
      ? JSON.parse(paymentIntent.metadata.shippingDetails)
      : null;

    if (!userEmail) {
      console.error("User email is missing in PaymentIntent metadata.");
      return;
    }

    if (!shippingDetails) {
      console.error("Shipping details are missing or invalid in metadata.");
      return;
    }

    const user = await getCartFromSanity(userEmail);
    if (!user || !user.cart) {
      console.error(`No user or cart found for email: ${userEmail}`);
      return;
    }

    // Group items by seller
    const groupedSellers = user.cart.reduce(
      (acc: Record<string, CartItem[]>, item: CartItem) => {
        const sellerId = item.user?._id;

        if (!sellerId) {
          console.warn("Item is missing seller ID. Skipping item:", item);
          return acc;
        }

        if (!acc[sellerId]) {
          acc[sellerId] = [];
        }

        acc[sellerId].push(item);
        return acc;
      },
      {}
    );

    console.log("Grouped Sellers:", groupedSellers);

    for (const [sellerId, items] of Object.entries(groupedSellers) as [
      string,
      CartItem[],
    ][]) {
      const sellerStripeAccountId = items[0]?.user?.stripeAccountId;

      // Skip the seller with ID 'MH7kyac4DmuRU6j51iL0It' if it doesn't have a Stripe account ID
      if (sellerId === "MH7kyac4DmuRU6j51iL0It") {
        await sendEmail({
          to: items[0]?.user?.email || "",
          subject: "New Order Received",
          html: generateSellerEmailContent(
            items,
            shippingDetails,
            paymentIntent.id
          ),
        });
        continue;
      }

      console.log(`Processing payout for seller: ${sellerId}`);

      // Calculate seller total
      const sellerTotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const platformFeePercentage = 0.1; // 10% platform fee
      let platformFee = sellerTotal * platformFeePercentage;

      // Skip platform fee for specific Stripe account
      if (sellerStripeAccountId === "acct_1QST64IpRAmWbte3") {
        platformFee = 0;
      }

      const sellerPayout = sellerTotal - platformFee;

      console.log(`Seller Total: $${sellerTotal}`);
      console.log(`Platform Fee: $${platformFee}`);
      console.log(`Seller Payout: $${sellerPayout}`);

      if (!sellerStripeAccountId) {
        continue;
      }

      try {
        if (sellerStripeAccountId !== "acct_1QST64IpRAmWbte3") {
          if (paymentIntent.latest_charge && typeof paymentIntent.latest_charge === "string") {
            // Create a transfer using the latest charge
            const transfer = await stripe.transfers.create({
              amount: Math.round(sellerPayout * 100), // Convert to cents
              currency: "usd",
              destination: sellerStripeAccountId,
              source_transaction: paymentIntent.latest_charge,
              description: `Payout for PaymentIntent: ${paymentIntent.id}`,
            });
            console.log("Transfer successful:", transfer);
          } else {
            console.error("No valid charge found for PaymentIntent");
          }
        }

        const sellerEmail = items[0]?.user?.email || "";

        if (sellerEmail) {
          await sendEmail({
            to: sellerEmail,
            subject: "New Order Received",
            html: generateSellerEmailContent(
              items,
              shippingDetails,
              paymentIntent.id,
              sellerPayout
            ),
          });
          console.log(
            `Order notification email sent to seller: ${sellerEmail}`
          );
        } else {
          console.warn(
            `No email found for seller ${sellerId}. Skipping seller email.`
          );
        }
      } catch (error) {
        console.error(`Error processing seller ${sellerId}:`, error);
      }
    }

    // Send email to buyer
    const buyerEmail = userEmail;

    if (buyerEmail) {
      try {
        await sendEmail({
          to: buyerEmail,
          subject: "Your Order Confirmation",
          html: generateBuyerEmailContent(
            user.cart,
            shippingDetails,
            paymentIntent.id
          ),
        });
        console.log(`Order confirmation email sent to buyer: ${buyerEmail}`);
      } catch (error) {
        console.error("Error sending email to buyer:", error);
      }
    } else {
      console.warn("No buyer email provided. Skipping buyer email.");
    }

    console.log("All transfers and notifications completed.");
  } catch (error) {
    console.error("Error processing PaymentIntent succeeded event:", error);
  }
}

// Handler for failed payments
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(
    "PaymentIntent failed:",
    paymentIntent.id,
    paymentIntent.last_payment_error
  );

  // Optionally update order status in your database
  await updateOrderStatus(paymentIntent.id, "failed");

  // Optionally notify the customer via email or UI
  await notifyCustomerPaymentFailed(paymentIntent);
}

// Handler for dispute creation
async function handleChargeDisputeCreated(dispute: Stripe.Dispute) {
  console.log("Dispute created:", dispute.id, dispute.amount);

  // Optionally update order or transaction status in your database
  await updateOrderStatusByCharge(
    typeof dispute.charge === "string" ? dispute.charge : dispute.charge.id,
    "disputed"
  );

  // Optionally notify the seller and/or customer
  await notifySellerOfDispute(dispute);
}

// Handler for dispute updates
async function handleChargeDisputeUpdated(dispute: Stripe.Dispute) {
  console.log("Dispute updated:", dispute.id, dispute.status);

  // Optionally update order or transaction status based on dispute resolution
  await updateOrderStatusByCharge(
    typeof dispute.charge === "string" ? dispute.charge : dispute.charge.id,
    "dispute_updated"
  );

  // Optionally notify the seller and/or customer about the update
  await notifySellerOfDisputeUpdate(dispute);
}

// Example database functions
async function updateOrderStatus(paymentIntentId: string, status: string) {
  // Implement your database logic to update the order status
  console.log(`Order ${paymentIntentId} status updated to ${status}`);
}

async function updateOrderStatusByCharge(chargeId: string, status: string) {
  // Implement your database logic to update the order status based on charge ID
  console.log(`Order for charge ${chargeId} status updated to ${status}`);
}

async function notifyCustomerPaymentFailed(
  paymentIntent: Stripe.PaymentIntent
) {
  // Implement your notification logic (e.g., send an email to the customer)
  console.log(
    `Notifying customer that paymentIntent ${paymentIntent.id} failed.`
  );
}

async function notifySellerOfDispute(dispute: Stripe.Dispute) {
  // Implement your notification logic (e.g., send an email to the seller)
  console.log(`Notifying seller of dispute ${dispute.id}.`);
}

async function notifySellerOfDisputeUpdate(dispute: Stripe.Dispute) {
  // Implement your notification logic (e.g., send an email to the seller)
  console.log(`Notifying seller of dispute update ${dispute.id}.`);
}
