import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set");
    throw new Error("RESEND_API_KEY is not set");
  }
  if (!process.env.RESEND_FROM_EMAIL) {
    console.error("RESEND_FROM_EMAIL is not set");
    throw new Error("RESEND_FROM_EMAIL is not set");
  }
  const result = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
  if (result.error) {
    console.error("Failed to send email:", result.error);
    throw result.error;
  }
  console.log("Email sent successfully:", result.data);
  return result;
}
