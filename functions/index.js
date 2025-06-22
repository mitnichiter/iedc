// File: functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Centralized config
const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;

// Check for config existence at startup
if (!gmailEmail || !gmailPassword) {
  console.error("CRITICAL ERROR: Missing gmail.email or gmail.password in Firebase config. Function will not start.");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

exports.sendEmailOtp = functions.https.onCall(async (data, context) => {
  // 1. Authentication Check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // 2. Securely get user data from the token
  const userId = context.auth.uid;
  const email = context.auth.token.email;

  if (!email) {
    throw new functions.https.HttpsError(
      "internal",
      "Could not find email in user token."
    );
  }

  // 3. Generate and save OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    await admin.firestore().collection("emailOtps").doc(userId).set({
      otp,
      email,
      expires: expiration,
    });
  } catch (error) {
    console.error("Firestore write error:", error);
    throw new functions.https.HttpsError("internal", "Failed to save OTP.");
  }

  // 4. Send Email
  const mailOptions = {
    from: `IEDC Carmel <${gmailEmail}>`,
    to: email,
    subject: "Your IEDC Login Verification Code",
    html: `<p>Your verification code is: <strong>${otp}</strong>.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Nodemailer transport error:", error);
    throw new functions.https.HttpsError("internal", "Failed to send email.");
  }
});


exports.verifyEmailOtp = functions.https.onCall(async (data, context) => {
    // ... (verify function can stay the same for now)
    const { userId, otp } = data;
    if (!userId || !otp) {
        throw new functions.https.HttpsError("invalid-argument", "UserId and OTP required.");
    }
    
    const otpDocRef = admin.firestore().collection("emailOtps").doc(userId);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
        throw new functions.https.HttpsError("not-found", "OTP not found.");
    }

    const { otp: storedOtp, expires } = otpDoc.data();

    if (new Date() > expires.toDate()) {
        await otpDocRef.delete();
        throw new functions.https.HttpsError("deadline-exceeded", "OTP expired.");
    }

    if (storedOtp !== otp) {
        throw new functions.https.HttpsError("permission-denied", "Invalid OTP.");
    }

    await otpDocRef.delete();
    return { success: true };
});