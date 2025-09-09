import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

// Handler for GET requests to fetch all events for an admin
export async function GET(request) {
  try {
    const eventsSnapshot = await db.collection('events').orderBy('date', 'desc').get();
    const events = eventsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Timestamps to ISO strings
        date: data.date.toDate().toISOString(),
        createdAt: data.createdAt.toDate().toISOString(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
      };
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error getting events (admin):", error);
    return NextResponse.json({ success: false, message: 'Failed to get events.' }, { status: 500 });
  }
}

// Handler for POST requests to create a new event
export async function POST(request) {
  try {
    const decodedToken = JSON.parse(request.headers.get('x-decoded-token'));
    const uid = decodedToken.uid;

    const {
      name, date, time, venue, description, bannerUrl, audience, registrationFee,
      endDate, endTime, bypassTimeConstraint, askForInstagram
    } = await request.json();

    if (!name || !date || !time || !venue || !audience) {
      return NextResponse.json({ success: false, message: 'Event name, date, time, venue, and audience are required.' }, { status: 400 });
    }

    const eventDate = new Date(date);

    if (!bypassTimeConstraint) {
      const now = new Date();
      const twentyFourHoursFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
      if (eventDate < twentyFourHoursFromNow) {
        return NextResponse.json({ success: false, message: 'Event must be scheduled at least 24 hours in the future.' }, { status: 400 });
      }
    }

    const eventToCreate = {
      name,
      date: admin.firestore.Timestamp.fromDate(eventDate),
      time,
      venue,
      description: description || '',
      bannerUrl: bannerUrl || '',
      audience,
      registrationFee: registrationFee || 0,
      askForInstagram: askForInstagram || false,
      registrationCount: 0,
      createdBy: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (endDate) {
      eventToCreate.endDate = admin.firestore.Timestamp.fromDate(new Date(endDate));
    }
    if (endTime) {
      eventToCreate.endTime = endTime;
    }

    const eventRef = await db.collection('events').add(eventToCreate);
    return NextResponse.json({ success: true, eventId: eventRef.id }, { status: 201 });

  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ success: false, message: 'Failed to create event.' }, { status: 500 });
  }
}
