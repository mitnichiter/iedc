"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, ClockIcon, MapPinIcon, UsersIcon, IndianRupeeIcon, FileEdit } from 'lucide-react';
import AttendeesList from './AttendeesList';
import Link from 'next/link';

export default function EventDetailsPage() {
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
        const functions = getFunctions();
        const getEvent = httpsCallable(functions, 'getEvent');
        const result = await getEvent({ eventId });
        setEvent(result.data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching event:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading event details...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }

  if (!event) {
    return <div className="text-center">Event not found.</div>;
  }

  const audienceMap = {
    'iedc-members': 'IEDC Members Only',
    'carmel-students': 'All Carmel Students',
    'all-students': 'All Students',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Banner Image */}
      {event.bannerUrl && (
        <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden shadow-lg">
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
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">{event.name}</h1>
          <p className="text-lg text-muted-foreground">{event.description}</p>
        </div>
        <Link href={`/admin/events/${eventId}/edit`} passHref>
          <Button variant="outline">
            <FileEdit className="mr-2 h-4 w-4" />
            Edit Event
          </Button>
        </Link>
      </div>

      {/* Event Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Date & Time</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{format(new Date(event.date), 'dd MMM yyyy')}</div>
                <p className="text-xs text-muted-foreground">{event.time}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Venue</CardTitle>
                <MapPinIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{event.venue}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Registration Fee</CardTitle>
                <IndianRupeeIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}
                </div>
            </CardContent>
        </Card>
        <Card className="lg:col-span-3">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Target Audience</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <Badge>{audienceMap[event.audience] || event.audience}</Badge>
            </CardContent>
        </Card>
      </div>

      <hr />

      {/* Tabs Section */}
      <Tabs defaultValue="attendees" className="w-full">
        <TabsList>
          <TabsTrigger value="attendees">Attendees</TabsTrigger>
          <TabsTrigger value="attendance">Attendance Report</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        <TabsContent value="attendees">
            <Card>
                <CardHeader>
                    <CardTitle>Registered Attendees</CardTitle>
                </CardHeader>
                <CardContent>
                    <AttendeesList eventId={eventId} />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Coming Soon</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="finance">
          <Card>
            <CardHeader>
              <CardTitle>Finance</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Coming Soon</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Coming Soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
