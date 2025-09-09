import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { transporter } from '@/lib/nodemailer';
import admin from 'firebase-admin';

// Function to send verification/rejection emails, adapted for the API route
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
        from: `IEDC Carmel <${process.env.GMAIL_EMAIL}>`,
        to: userEmail,
        subject: subject,
        html: html,
    };

    await transporter.sendMail(mailOptions);
}

// Handler for POST requests to verify/reject a registration
export async function POST(request, { params }) {
    try {
        const { eventId, registrationId } = params;
        const { newStatus } = await request.json();

        if (!eventId || !registrationId || !newStatus || !['verified', 'rejected', 'pending'].includes(newStatus)) {
            return NextResponse.json({ success: false, message: 'Event ID, Registration ID, and a valid status are required.' }, { status: 400 });
        }

        const registrationRef = db.collection('events').doc(eventId).collection('registrations').doc(registrationId);
        const registrationDoc = await registrationRef.get();
        if (!registrationDoc.exists) {
            return NextResponse.json({ success: false, message: 'Registration not found.' }, { status: 404 });
        }

        await registrationRef.update({ status: newStatus });

        if (newStatus === 'verified' || newStatus === 'rejected') {
            const userData = registrationDoc.data();
            const eventDoc = await db.collection('events').doc(eventId).get();
            const eventName = eventDoc.exists ? eventDoc.data().name : 'the event';
            await sendRegistrationStatusEmail(userData.email, userData.fullName, eventName, newStatus);
        }

        return NextResponse.json({ success: true, message: `Registration status updated to ${newStatus}.` });

    } catch (error) {
        console.error("Error verifying registration:", error);
        return NextResponse.json({ success: false, message: 'Failed to verify registration.' }, { status: 500 });
    }
}

// Handler for DELETE requests to delete a registration
export async function DELETE(request, { params }) {
    try {
        const { eventId, registrationId } = params;
        if (!eventId || !registrationId) {
            return NextResponse.json({ success: false, message: 'Event ID and Registration ID are required.' }, { status: 400 });
        }

        const eventRef = db.collection('events').doc(eventId);
        const registrationRef = eventRef.collection('registrations').doc(registrationId);

        // Use a transaction to ensure atomicity
        await db.runTransaction(async (transaction) => {
            const registrationDoc = await transaction.get(registrationRef);
            if (!registrationDoc.exists) {
                throw new Error('Registration not found'); // This will be caught and returned as a 404
            }

            // Delete the registration document
            transaction.delete(registrationRef);
            // Decrement the registration count on the event
            transaction.update(eventRef, {
                registrationCount: admin.firestore.FieldValue.increment(-1)
            });
        });

        return NextResponse.json({ success: true, message: 'Registration deleted successfully.' });

    } catch (error) {
        console.error("Error deleting registration:", error);
        if (error.message === 'Registration not found') {
            return NextResponse.json({ success: false, message: 'Registration not found.' }, { status: 404 });
        }
        return NextResponse.json({ success: false, message: 'Failed to delete registration.' }, { status: 500 });
    }
}
