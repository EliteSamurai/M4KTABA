import { readClient } from "@/studio-m4ktaba/client";
import { createTransport } from "nodemailer";

export async function POST() {
  try {
    // Fetch all orders with 'refundStatus' as 'requested'
    const orders = await readClient.fetch(
      `*[_type == "order" && cart[].refundDetails.refundStatus == "requested"]`
    );

    if (!orders || orders.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending refund requests." }),
        { status: 404 }
      );
    }

    const transporter = createTransport({
      service: "SMTP",
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Iterate through each order and send checkup email
    for (const order of orders) {
      for (const item of order.cartItems) {
        if (item.refundStatus === "requested") {
          const userEmail = item.user.email;

          await transporter.sendMail({
            from: `M4KTABA <noreply@m4ktaba.com>`,
            to: userEmail,
            subject: "Refund Request Checkup",
            text: `This is a follow-up email regarding your refund request for order ID: ${order._id}. Please let us know if you need any assistance. Your request was initiated on: ${item.refundDetails.refundDate}.`,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ message: "Checkup emails sent successfully." }),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error sending checkup emails:", error);
      return new Response(
        JSON.stringify({
          message: "Error sending checkup emails.",
          error: error.message,
        }),
        { status: 500 }
      );
    }
  }
}
