import nodemailer from 'nodemailer';

// Check for environment variables at the module level to fail fast.
if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
  throw new Error('Missing GMAIL_EMAIL or GMAIL_APP_PASSWORD environment variables');
}

export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const mailOptions = {
    from: process.env.GMAIL_EMAIL,
    to: process.env.GMAIL_EMAIL,
};
