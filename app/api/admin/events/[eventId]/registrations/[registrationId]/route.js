import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { transporter } from '@/lib/nodemailer';

export async function POST(req, { params }) {
    try {
        const authorization = req.headers.get('authorization');
        if (!authorization || !authorization.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const idToken = authorization.split('Bearer ')[1];

        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(idToken);
        } catch (error) {
            console.error('Error verifying ID token:', error);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (decodedToken.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { eventId, registrationId } = params;
        const { status } = await req.json(); // e.g., 'verified', 'rejected'

        if (!status) {
            return NextResponse.json({ error: 'Status is required.' }, { status: 400 });
        }

        const registrationRef = adminDb.collection('events').doc(eventId).collection('registrations').doc(registrationId);
        const registrationDoc = await registrationRef.get();

        if (!registrationDoc.exists) {
            return NextResponse.json({ error: 'Registration not found.' }, { status: 404 });
        }

        await registrationRef.update({ status: status });

        const registrationData = registrationDoc.data();
        const userEmail = registrationData.userEmail;

        const eventDoc = await adminDb.collection('events').doc(eventId).get();
        const eventName = eventDoc.exists ? eventDoc.data().name : 'the event';

        if (userEmail) {
            const mailOptions = {
                from: `IEDC Carmel <${process.env.GMAIL_EMAIL}>`,
                to: userEmail,
                subject: `Your registration status for ${eventName}`,
                html: `<p>Hello,</p><p>Your registration for the event "${eventName}" has been updated to: <strong>${status}</strong>.</p><p>Thank you,</p><p>IEDC Carmel Team</p>`,
            };
            // We don't want to block the response for the email sending
            transporter.sendMail(mailOptions).catch(console.error);
        }

        return NextResponse.json({ success: true, message: `Registration ${registrationId} status updated to ${status}.` });

    } catch (error) {
        console.error('Error verifying registration:', error);
        return NextResponse.json({ error: 'Failed to verify registration.' }, { status: 500 });
    }
}
