// File: functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Initialize ONLY the admin SDK in the global scope. This is fast.
admin.initializeApp();

// 1️⃣ Cloud Function to SEND the OTP email
exports.sendEmailOtp = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated.
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in to request an OTP.");
  }

  // --- LAZY INITIALIZATION ---
  // Load config and set up the email transporter INSIDE the function.
  // This makes deployment much faster and avoids timeouts.
  const gmailEmail = functions.config().gmail.email;
  const gmailPassword = functions.config().gmail.password;

  if (!gmailEmail || !gmailPassword) {
    console.error("CRITICAL: Missing gmail.email or gmail.password in Firebase config.");
    throw new functions.https.HttpsError("internal", "Application is not configured correctly for sending email.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailEmail,
      pass: gmailPassword,
    },
  });
  // --- END LAZY INITIALIZATION ---


  // Securely get user info from the authentication context.
  const userId = context.auth.uid;
  const email = context.auth.token.email;

  if (!email || !userId) {
    throw new functions.https.HttpsError("internal", "Could not retrieve user details from token.");
  }

  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

  // Save the OTP to Firestore
  await admin.firestore().collection("emailOtps").doc(userId).set({
    otp,
    email,
    expires: expiration,
  });

  // Compose the email
  const mailOptions = {
    from: `IEDC <${gmailEmail}>`,
    to: email,
    subject: "Your IEDC Login Verification Code",
    html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code will expire in 10 minutes.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Failed to send email", error);
    throw new functions.https.HttpsError("internal", "Could not send email.");
  }
});


// 2️⃣ Cloud Function to VERIFY the OTP (this function remains unchanged)
exports.verifyEmailOtp = functions.https.onCall(async (data, context) => {
  const { userId, otp } = data;
  if (!userId || !otp) {
    throw new functions.https.HttpsError("invalid-argument", "UserId and OTP are required.");
  }
  const otpDocRef = admin.firestore().collection("emailOtps").doc(userId);
  const otpDoc = await otpDocRef.get();
  if (!otpDoc.exists) {
    throw new functions.https.HttpsError("not-found", "OTP not found or already used.");
  }
  const { otp: storedOtp, expires } = otpDoc.data();
  if (new Date() > expires.toDate()) {
    await otpDocRef.delete();
    throw new functions.https.HttpsError("deadline-exceeded", "The OTP has expired.");
  }
  if (storedOtp !== otp) {
    throw new functions.https.HttpsError("permission-denied", "Invalid OTP.");
  }
  await otpDocRef.delete();
  return { success: true };
});