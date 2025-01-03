import { NextResponse } from "next/server";
import { createTransport } from "nodemailer";

export async function POST(request: Request) {
  const formData = await request.formData();

  const transporter = createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Get all attachments as an array of files
  const attachments = formData.getAll("attachments") as File[];

  // Handle attachments concurrently using Promise.all
  const attachmentBuffers = await Promise.all(
    attachments.map(async (file) => {
      const buffer = await file.arrayBuffer();
      return {
        filename: file.name,
        content: Buffer.from(buffer),
      };
    })
  );

  const mailOptions = {
    from: process.env.SUPPORT_EMAIL,
    to: process.env.SUPPORT_EMAIL,
    subject: "New Support Request",
    text: `
Email: ${formData.get("email")}
Contact Reason: ${formData.get("contactReason")}
Order Number: ${formData.get("orderNumber") || "N/A"}
Message:
${formData.get("message")}
    `,
    attachments: attachmentBuffers,
  };

  try {
    // Use the transporter to send the email
    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send email:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}
