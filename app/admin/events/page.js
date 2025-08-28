"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";


export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const functions = getFunctions();
        const getEvents = httpsCallable(functions, 'getEvents');
        const result = await getEvents();
        setEvents(result.data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching events:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleAction = (action, eventId) => {
    if (action === 'view') {
      router.push(`/admin/events/${eventId}`);
    }
    // TODO: Implement edit and delete actions
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Event Management</h1>
        <Link href="/admin/events/create" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Event
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Events</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading events...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          {!isLoading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length > 0 ? (
                  events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.name}</TableCell>
                      <TableCell>{format(new Date(event.date), "PPP")}</TableCell>
                      <TableCell>{event.venue}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{event.audience.replace('-', ' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        {event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleAction('view', event.id)}>
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                            <DropdownMenuItem disabled className="text-red-500">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No events found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
