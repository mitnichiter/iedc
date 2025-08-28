"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, MapPinIcon, IndianRupeeIcon, ArrowRight } from 'lucide-react';

export default function PublicEventDetailsPage() {
  const params = useParams();
  const { eventId } = params;

  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId) return;

    const fetchEvent = async () => {
      setIsLoading(true);
      try {
        const eventRef = doc(db, 'events', eventId);
        const eventDoc = await getDoc(eventRef);

        if (eventDoc.exists()) {
          setEvent({ id: eventDoc.id, ...eventDoc.data() });
        } else {
          setError("Event not found.");
        }
      } catch (err) {
        setError("Failed to fetch event details.");
        console.error("Error fetching event:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading event details...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center h-screen flex justify-center items-center">{error}</div>;
  }

  if (!event) {
    return <div className="text-center h-screen flex justify-center items-center">Event not found.</div>;
  }

  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Banner Image */}
          {event.bannerUrl && (
            <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden shadow-lg mb-8">
              <Image
                src={event.bannerUrl}
                alt={`${event.name} banner`}
                layout="fill"
                objectFit="cover"
                priority
              />
            </div>
          )}

          {/* Event Header */}
          <div className="space-y-4 mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{event.name}</h1>
            <p className="text-lg text-muted-foreground">{event.description}</p>
          </div>

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2 space-y-6">
                <h2 className="text-2xl font-semibold border-b pb-2">Event Details</h2>
                <div className="flex items-center gap-4">
                    <CalendarIcon className="h-6 w-6 text-primary"/>
                    <div>
                        <p className="font-semibold">Date & Time</p>
                        <p className="text-muted-foreground">{format(event.date.toDate(), 'EEEE, MMMM d, yyyy')} at {event.time}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <MapPinIcon className="h-6 w-6 text-primary"/>
                    <div>
                        <p className="font-semibold">Venue</p>
                        <p className="text-muted-foreground">{event.venue}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-4">
                    <IndianRupeeIcon className="h-6 w-6 text-primary"/>
                    <div>
                        <p className="font-semibold">Registration Fee</p>
                        <p className="text-muted-foreground">{event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}</p>
                    </div>
                </div>
            </div>
            <div className="md:col-span-1">
                <Card className="sticky top-24">
                    <CardHeader>
                        <CardTitle>Register for this Event</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">Secure your spot now!</p>
                        <Link href={`/events/${eventId}/register`} passHref>
                            <Button size="lg" className="w-full">
                                Register Now <ArrowRight className="ml-2 h-5 w-5"/>
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
