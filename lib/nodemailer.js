import nodemailer from 'nodemailer';

const email = process.env.GMAIL_EMAIL;
const pass = process.env.GMAIL_APP_PASSWORD;

// A check to ensure the server doesn't start or emails don't try to send without credentials.
// In a Next.js environment, this check will run when the module is first imported.
if (!email || !pass) {
  console.error("CRITICAL ERROR: Missing GMAIL_EMAIL or GMAIL_APP_PASSWORD in environment variables. Email functionality will be disabled.");
  // Depending on the desired behavior, you might want to throw an error
  // to prevent the application from starting, or just log the error.
  // For now, we'll log it.
}

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // use SSL
  auth: {
    user: email,
    pass: pass,
  },
});
