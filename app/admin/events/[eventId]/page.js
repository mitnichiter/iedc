"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { auth } from '@/lib/firebase'; // Import auth for getting the token
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, ClockIcon, MapPinIcon, UsersIcon, IndianRupeeIcon, FileEdit, Share2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import RegistrationsList from './RegistrationsList';
import Link from 'next/link';

export default function EventDetailsPage() {
  const params = useParams();
  const { eventId } = params;

  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    const fetchEvent = async () => {
      if (!auth.currentUser) {
        // Wait for auth state to be ready
        setTimeout(fetchEvent, 100);
        return;
      }

      setIsLoading(true);
      try {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`/api/admin/events/${eventId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch event.');
        }
        const data = await response.json();
        setEvent(data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching event:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, auth.currentUser]);

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
        <div className="space-y-2 max-w-4xl">
          <h1 className="text-4xl font-extrabold tracking-tight">{event.name}</h1>
          <p className="text-lg text-muted-foreground">
            {event.description.length > 150 ? (
              <>
                {`${event.description.substring(0, 150)}... `}
                <Button variant="link" className="p-0 h-auto" onClick={() => setIsDescriptionModalOpen(true)}>
                  View More
                </Button>
              </>
            ) : (
              event.description
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const registrationUrl = `${window.location.origin}/events/${eventId}/register`;
              navigator.clipboard.writeText(registrationUrl);
              setIsCopied(true);
              setTimeout(() => setIsCopied(false), 2000);
            }}
          >
            <Share2 className="mr-2 h-4 w-4" />
            {isCopied ? 'Copied!' : 'Share Link'}
          </Button>
          <Link href={`/admin/events/${eventId}/edit`} passHref>
            <Button variant="outline">
              <FileEdit className="mr-2 h-4 w-4" />
              Edit Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Event Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Date & Time</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold break-words">{format(new Date(event.date), 'dd MMM yyyy')}</div>
                <p className="text-xs text-muted-foreground">{event.time}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Venue</CardTitle>
                <MapPinIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold break-words">{event.venue}</div>
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
        <Card>
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

      {/* Description Modal */}
      <Dialog open={isDescriptionModalOpen} onOpenChange={setIsDescriptionModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{event.name} - Full Description</DialogTitle>
          </DialogHeader>
          <div className="py-4 prose max-w-none">
            <p>{event.description}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabs Section */}
      <Tabs defaultValue="registrations" className="w-full">
        <TabsList>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="attendance">Attendance Report</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        <TabsContent value="registrations">
            <Card>
                <CardHeader>
                    <CardTitle>Event Registrations</CardTitle>
                </CardHeader>
                <CardContent>
                    <RegistrationsList eventId={eventId} />
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
