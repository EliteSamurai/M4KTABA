import nodemailer from "nodemailer";
import { CartItem } from "@/types/shipping-types";

export async function POST(req: Request) {
  const data = await req.json();
  const { buyerEmail, sellersEmails, items } = data;

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    } as nodemailer.TransportOptions);

    transporter.verify((error, success) => {
      if (error) {
        console.error("SMTP Connection Error:", error);
      } else {
        console.log("SMTP Connected:", success);
      }
    });

    // Send Email to Buyer
    const buyerMessage = `
      <h1>Thank you for your purchase!</h1>
      <p>Here are the details of your purchase:</p>
      <ul>
        ${items
          .map(
            (item: CartItem) =>
              `<li>${item.title} - Quantity: ${item.quantity} - Price: $${item.price}</li>`
          )
          .join("")}
      </ul>
      <p>Total: $${items.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0)}</p>
    `;

    await transporter.sendMail({
      from: '"Your Store" <no-reply@yourstore.com>',
      to: buyerEmail,
      subject: "Purchase Confirmation",
      html: buyerMessage,
    });

    // Send Email to Sellers
    for (const sellerEmail of sellersEmails) {
      const sellerMessage = `
        <h1>New Purchase Notification</h1>
        <p>You have purchased the following items:</p>
        <ul>
          ${items
            .map(
              (item: CartItem) =>
                `<li>${item.title} - Quantity: ${item.quantity} - Price: $${item.price}</li>`
            )
            .join("")}
        </ul>
      `;

      await transporter.sendMail({
        from: "M4KTABA <contact@M4KTABA.com>",
        to: sellerEmail,
        subject: "New Purchase",
        html: sellerMessage,
      });
    }

    return new Response(
      JSON.stringify({ message: "Emails sent successfully" }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Email sending error:", error);
    return new Response(JSON.stringify({ message: "Failed to send emails" }), {
      status: 500,
    });
  }
}
