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

// ==================================================================
// =================== EVENT MANAGEMENT FUNCTIONS ===================
// ==================================================================

// Function for an admin to create a new event
exports.createEvent = functions.https.onCall(async (data, context) => {
  // 1. Authentication and Admin Check
  // @ts-ignore
  if (context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can create events.');
  }

  // 2. Data Validation
  const { name, date, venue, description, bannerUrl, audience, registrationFee } = data;
  if (!name || !date || !venue || !audience) {
    throw new functions.https.HttpsError('invalid-argument', 'Event name, date, venue, and audience are required.');
  }

  // Date validation: must be at least 24 hours in the future
  const eventDate = new Date(date);
  const now = new Date();
  const twentyFourHoursFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));

  if (eventDate < twentyFourHoursFromNow) {
    throw new functions.https.HttpsError('invalid-argument', 'Event date must be at least 24 hours in the future.');
  }

  // 3. Create Event in Firestore
  try {
    const eventRef = await admin.firestore().collection('events').add({
      name,
      date: admin.firestore.Timestamp.fromDate(eventDate),
      venue,
      description: description || '',
      bannerUrl: bannerUrl || '',
      audience, // e.g., "members", "all-students", "public"
      registrationFee: registrationFee || 0,
      createdBy: context.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true, eventId: eventRef.id };
  } catch (error) {
    console.error("Error creating event:", error);
    throw new functions.https.HttpsError('internal', 'Failed to create event.');
  }
});

// Function for an admin to update an existing event
exports.updateEvent = functions.https.onCall(async (data, context) => {
  // 1. Authentication and Admin Check
  // @ts-ignore
  if (context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can update events.');
  }

  // 2. Data Validation
  const { eventId, ...eventData } = data;
  if (!eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'Event ID is required.');
  }

  // If date is being updated, validate it
  if (eventData.date) {
    const eventDate = new Date(eventData.date);
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
    if (eventDate < twentyFourHoursFromNow) {
        throw new functions.https.HttpsError('invalid-argument', 'Event date must be at least 24 hours in the future.');
    }
    // Convert date string to Firestore Timestamp
    eventData.date = admin.firestore.Timestamp.fromDate(eventDate);
  }


  // 3. Update Event in Firestore
  try {
    await admin.firestore().collection('events').doc(eventId).update({
        ...eventData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating event:", error);
    throw new functions.https.HttpsError('internal', 'Failed to update event.');
  }
});

// Function for an admin to delete an event
exports.deleteEvent = functions.https.onCall(async (data, context) => {
  // 1. Authentication and Admin Check
  // @ts-ignore
  if (context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can delete events.');
  }

  // 2. Data Validation
  const { eventId } = data;
  if (!eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'Event ID is required.');
  }

  // 3. Delete Event from Firestore
  try {
    await admin.firestore().collection('events').doc(eventId).delete();
    // Optional: Also remove this event from all users' registeredEvents list
    // This is more complex and can be added later if needed.
    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    throw new functions.https.HttpsError('internal', 'Failed to delete event.');
  }
});

// NEW registerForEvent function
exports.registerForEvent = functions.https.onCall(async (data, context) => {
  // User must be authenticated to register, but we handle anon users too
  const userId = context.auth ? context.auth.uid : 'anonymous_' + Date.now();

  const { eventId, registrationData, screenshotUrl } = data;
  if (!eventId || !registrationData || !screenshotUrl) {
    throw new functions.https.HttpsError('invalid-argument', 'Event ID, registration data, and screenshot are required.');
  }

  // Use email as a unique identifier for registrations if user is not logged in
  const registrationId = context.auth ? userId : registrationData.email;
  if(!registrationId) {
    throw new functions.https.HttpsError('invalid-argument', 'Email is required for anonymous registration.');
  }

  const registrationRef = admin.firestore()
    .collection('events').doc(eventId)
    .collection('registrations').doc(registrationId);

  try {
    await registrationRef.set({
      ...registrationData,
      userId: context.auth ? userId : null,
      screenshotUrl: screenshotUrl,
      status: 'pending', // Initial status
      registeredAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true, message: 'Registration submitted successfully. Awaiting verification.' };
  } catch (error) {
    console.error("Error submitting registration:", error);
    throw new functions.https.HttpsError('internal', 'Failed to submit registration.');
  }
});

// NEW function to send verification/rejection emails
async function sendRegistrationStatusEmail(userEmail, userName, eventName, status) {
    const subject = `Update on your registration for ${eventName}`;
    let html;

    if (status === 'verified') {
        html = `<p>Hi ${userName},</p>
                <p>Great news! Your registration for the event "<strong>${eventName}</strong>" has been verified and confirmed.</p>
                <p>We look forward to seeing you there!</p>
                <p>Thanks,<br/>The IEDC Carmel Team</p>`;
    } else { // rejected
        html = `<p>Hi ${userName},</p>
                <p>There was an issue with your registration for the event "<strong>${eventName}</strong>".</p>
                <p>Our team could not verify your payment screenshot. Please double-check the details and try again, or contact the event management team for assistance.</p>
                <p>You can find contact information in the event brochure.</p>
                <p>Thanks,<br/>The IEDC Carmel Team</p>`;
    }

    const mailOptions = {
        from: `IEDC Carmel <${gmailEmail}>`,
        to: userEmail,
        subject: subject,
        html: html,
    };

    await transporter.sendMail(mailOptions);
}


// NEW function for an admin to verify a registration
exports.verifyRegistration = functions.https.onCall(async (data, context) => {
    if (!context.auth || context.auth.token.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can verify registrations.');
    }

    const { eventId, registrationId, newStatus } = data;
    if (!eventId || !registrationId || !newStatus || !['verified', 'rejected', 'pending'].includes(newStatus)) {
        throw new functions.https.HttpsError('invalid-argument', 'Event ID, Registration ID, and a valid status are required.');
    }

    const registrationRef = admin.firestore()
        .collection('events').doc(eventId)
        .collection('registrations').doc(registrationId);

    try {
        const registrationDoc = await registrationRef.get();
        if (!registrationDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Registration not found.');
        }

        await registrationRef.update({ status: newStatus });

        // Send email to the user, unless just moving back to pending
        if (newStatus === 'verified' || newStatus === 'rejected') {
            const userData = registrationDoc.data();
            const eventDoc = await admin.firestore().collection('events').doc(eventId).get();
            const eventName = eventDoc.exists ? eventDoc.data().name : 'the event';
            await sendRegistrationStatusEmail(userData.email, userData.fullName, eventName, newStatus);
        }

        return { success: true, message: `Registration status updated to ${newStatus}.` };
    } catch (error) {
        console.error("Error verifying registration:", error);
        throw new functions.https.HttpsError('internal', 'Failed to verify registration.');
    }
});


// RENAMED and UPDATED function to get registrations
exports.getEventRegistrations = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can view event registrations.');
  }

  const { eventId } = data;
  if (!eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'Event ID is required.');
  }

  try {
    const registrationsSnapshot = await admin.firestore()
        .collection('events').doc(eventId)
        .collection('registrations').orderBy('registeredAt', 'desc').get();

    const registrations = registrationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        registeredAt: doc.data().registeredAt.toDate().toISOString(),
    }));
    return registrations;
  } catch (error) {
    console.error("Error getting event registrations:", error);
    throw new functions.https.HttpsError('internal', 'Failed to get registrations.');
  }
});

// Function for an admin to get all events
exports.getEvents = functions.https.onCall(async (data, context) => {
  // 1. Authentication and Admin Check
  // @ts-ignore
  if (context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can view the list of events.');
  }

  // 2. Fetch events from Firestore
  try {
    const eventsSnapshot = await admin.firestore().collection('events').orderBy('date', 'desc').get();
    const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Convert Timestamps to ISO strings
    const sanitizedEvents = events.map(event => ({
      ...event,
      date: event.date.toDate().toISOString(),
      createdAt: event.createdAt.toDate().toISOString(),
      updatedAt: event.updatedAt ? event.updatedAt.toDate().toISOString() : null,
    }));
    return sanitizedEvents;
  } catch (error) {
    console.error("Error getting events:", error);
    throw new functions.https.HttpsError('internal', 'Failed to get events.');
  }
});

// Function for an admin to get a single event
exports.getEvent = functions.https.onCall(async (data, context) => {
  // 1. Authentication and Admin Check
  // @ts-ignore
  if (context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can view event details.');
  }

  // 2. Data Validation
  const { eventId } = data;
  if (!eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'Event ID is required.');
  }

  // 3. Fetch event from Firestore
  try {
    const eventDoc = await admin.firestore().collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Event not found.');
    }
    const eventData = eventDoc.data();
    // Convert Timestamps to ISO strings
    const sanitizedEvent = {
      ...eventData,
      id: eventDoc.id,
      date: eventData.date.toDate().toISOString(),
      createdAt: eventData.createdAt.toDate().toISOString(),
      updatedAt: eventData.updatedAt ? eventData.updatedAt.toDate().toISOString() : null,
    };
    return sanitizedEvent;
  } catch (error) {
    console.error("Error getting event:", error);
    if (error.code === 'not-found') {
        throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to get event details.');
  }
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

// Function to send OTP for new user registration (callable)
exports.sendRegistrationEmailOtp = functions.https.onCall(async (data, context) => {
  // 1. Data Validation
  const email = data.email;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { // Basic email validation
    throw new functions.https.HttpsError(
      "invalid-argument",
      "A valid email address must be provided."
    );
  }

  // 2. Generate and save OTP
  // We'll use the email itself as the document ID in a new collection for registration OTPs
  // This avoids needing a userId before the user is created.
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    // Using a separate collection for registration OTPs
    await admin.firestore().collection("registrationOtps").doc(email).set({
      otp,
      email, // Storing email again for clarity, though it's the doc ID
      expires: expiration,
      verified: false, // Add a verified flag
    });
  } catch (error) {
    console.error("Firestore write error (registrationOtps):", error);
    throw new functions.https.HttpsError("internal", "Failed to save OTP for registration.");
  }

  // 3. Send Email
  const mailOptions = {
    from: `IEDC Carmel <${gmailEmail}>`,
    to: email,
    subject: "Verify Your Email for IEDC Registration",
    html: `<p>Your email verification code is: <strong>${otp}</strong>. This code will expire in 10 minutes.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: "Verification code sent to your email." };
  } catch (error) {
    console.error("Nodemailer transport error (registration):", error);
    throw new functions.https.HttpsError("internal", "Failed to send verification email.");
  }
});

// Function to verify OTP for new user registration (callable)
exports.verifyRegistrationEmailOtp = functions.https.onCall(async (data, context) => {
  const { email, otp } = data;

  if (!email || !otp) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Email and OTP must be provided."
    );
  }

  const otpDocRef = admin.firestore().collection("registrationOtps").doc(email);
  const otpDoc = await otpDocRef.get();

  if (!otpDoc.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "OTP not found for this email. It may have expired or never been sent."
    );
  }

  const { otp: storedOtp, expires, verified } = otpDoc.data();

  if (verified) { // If already verified, perhaps by a concurrent request
    return { success: true, message: "Email already verified." };
  }

  if (new Date() > expires.toDate()) {
    await otpDocRef.delete(); // Clean up expired OTP
    throw new functions.https.HttpsError(
      "deadline-exceeded",
      "OTP has expired. Please request a new one."
    );
  }

  if (storedOtp !== otp) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Invalid OTP provided."
    );
  }

  // Mark OTP as verified in Firestore
  try {
    await otpDocRef.update({ verified: true });
    // We don't delete it immediately, to prevent re-use until user creation or another cleanup process.
    // Or, we could delete it if user creation is guaranteed to happen right after.
    // For now, just marking as verified.
    return { success: true, message: "OTP verified successfully." };
  } catch (error) {
    console.error("Firestore update error (registrationOtps verification):", error);
    throw new functions.https.HttpsError("internal", "Failed to update OTP status.");
  }
<<<<<<< feat/reset-password
<<<<<<< feat/reset-password
=======
>>>>>>> main
});

// Function for an admin to set a user's role
exports.setUserRole = functions.https.onCall(async (data, context) => {
  // 1. Authentication and Admin Check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }
  // @ts-ignore
  if (context.auth.token.role !== "admin") { // REVERTED: Only admin can set roles
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can set user roles." // REVERTED: Error message
    );
  }

  // 2. Data Validation
  const { userIdToUpdate, newRole } = data;
  if (!userIdToUpdate || !newRole) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "User ID and new role must be provided."
    );
  }

  const validRoles = ["student", "admin"]; // Define valid roles
  if (!validRoles.includes(newRole)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid role specified."
    );
  }

  try {
    // 3. Set Custom Claim
    // @ts-ignore
    await admin.auth().setCustomUserClaims(userIdToUpdate, { role: newRole });

    // 4. Update Firestore Document
    const userDocRef = admin.firestore().collection("users").doc(userIdToUpdate);
    await userDocRef.update({ role: newRole });

    return { success: true, message: `User ${userIdToUpdate} role updated to ${newRole}.` };
  } catch (error) {
    console.error("Error setting user role:", error);
    // @ts-ignore
    if (error.code === "auth/user-not-found") {
        throw new functions.https.HttpsError("not-found", "The specified user to update was not found.");
    }
    throw new functions.https.HttpsError("internal", "Failed to set user role.");
  }
});

// Function for an admin to delete a user's account
exports.deleteUserAccount = functions.https.onCall(async (data, context) => {
  // 1. Authentication and Admin Check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }
  // @ts-ignore
  if (context.auth.token.role !== "admin") { // REVERTED: Only admin can delete users
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can delete user accounts." // REVERTED: Error message
    );
  }

  // 2. Data Validation
  const { userIdToDelete } = data;
  if (!userIdToDelete) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "User ID to delete must be provided."
    );
  }

  // Prevent admin from deleting themselves via this function as a safeguard
  if (context.auth.uid === userIdToDelete) {
    throw new functions.https.HttpsError(
        "permission-denied",
        "Admins cannot delete their own account through this function."
    );
  }

  try {
    // 3. Delete Firebase Auth User
    // @ts-ignore
    await admin.auth().deleteUser(userIdToDelete);

    // 4. Delete Firestore User Document
    const userDocRef = admin.firestore().collection("users").doc(userIdToDelete);
    await userDocRef.delete();

    // TODO: Consider deleting other user-associated data if necessary (e.g., from Storage, other collections)

    return { success: true, message: `User ${userIdToDelete} and their data have been deleted.` };
  } catch (error) {
    console.error("Error deleting user account:", error);
    // @ts-ignore
    if (error.code === "auth/user-not-found") {
        throw new functions.https.HttpsError("not-found", "The specified user to delete was not found in Firebase Authentication.");
    }
    throw new functions.https.HttpsError("internal", "Failed to delete user account.");
  }
});

// Function to grant admin role (set custom claim and update Firestore)
exports.grantAdminRole = functions.https.onCall(async (data, context) => {
  // It's good practice to ensure the caller is authenticated, even if this function is for setup.
  // For a production setup, you might restrict this to a specific super admin UID or disable it after setup.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }
  // REVERTED: Now, only an admin can call this function to grant 'admin' role to others.
  // @ts-ignore
  if (context.auth.token.role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can grant admin roles."
    );
  }

  const targetUid = data.uid;
  if (!targetUid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "UID of the target user must be provided."
    );
  }

  try {
    // Set custom claim for role: 'admin'
    // @ts-ignore
    await admin.auth().setCustomUserClaims(targetUid, { role: "admin" });

    // Update the role in the user's Firestore document as well for consistency
    const userDocRef = admin.firestore().collection("users").doc(targetUid);
    await userDocRef.update({ role: "admin" }); // Using update assuming the doc exists. Use set with merge if unsure.

    return { success: true, message: `Successfully granted admin role to user ${targetUid}.` };
  } catch (error) {
    console.error("Error granting admin role:", error);
    // @ts-ignore
    if (error.code === "auth/user-not-found") {
        throw new functions.https.HttpsError("not-found", "The specified user to grant admin role was not found in Firebase Authentication.");
    }
    throw new functions.https.HttpsError("internal", "Failed to grant admin role.");
  }
});

// Function for an admin to approve a user's pending registration
exports.approveUser = functions.https.onCall(async (data, context) => {
  // 1. Authentication and Admin Check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }
  // @ts-ignore
  if (context.auth.token.role !== "admin") { // Only admins can approve users
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can approve users."
    );
  }

  // 2. Data Validation
  const { userIdToApprove } = data;
  if (!userIdToApprove) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "User ID to approve must be provided."
    );
  }

  try {
    // 3. Update Firestore Document
    const userDocRef = admin.firestore().collection("users").doc(userIdToApprove);
    await userDocRef.update({
      status: "approved",
      approvedAt: admin.firestore.FieldValue.serverTimestamp() // Optional: record approval time
    });

    // TODO: Optionally send a welcome/approval email to the user here.

    return { success: true, message: `User ${userIdToApprove} has been approved.` };
  } catch (error) {
    console.error("Error approving user:", error);
    // @ts-ignore
    if (error.code === "not-found") { // Firestore specific error code for .update() if doc doesn't exist
        throw new functions.https.HttpsError("not-found", "The specified user to approve was not found in Firestore.");
    }
    throw new functions.https.HttpsError("internal", "Failed to approve user.");
  }
<<<<<<< feat/reset-password
=======
>>>>>>> main
});
=======
});
>>>>>>> main
