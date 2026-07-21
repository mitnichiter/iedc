"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { format } from 'date-fns';
import { Edit, Users, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PlusCircle } from 'lucide-react';

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;

    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      setEvents(events.filter(e => e.id !== id));
    } catch (error) {
       console.error("Error deleting event:", error);
       alert("Failed to delete event.");
    }
  };

  if (isLoading) return <div>Loading events...</div>;

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
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Event Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {events.length === 0 ? (
                    <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">No events found.</TableCell>
                    </TableRow>
                ) : (
                    events.map((event) => (
                    <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.name}</TableCell>
                        <TableCell>{format(new Date(event.date), 'PPP')}</TableCell>
                        <TableCell>{event.location}</TableCell>
                        <TableCell className="flex gap-2">
                        <Link href={`/admin/events/${event.id}/edit`}>
                            <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                        </Link>
                        {/* <Link href={`/admin/events/${event.id}`}>
                            <Button variant="ghost" size="icon"><Users className="h-4 w-4" /></Button>
                        </Link> */}
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(event.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        </TableCell>
                    </TableRow>
                    ))
                )}
                </TableBody>
            </Table>
          </CardContent>
      </Card>
    </div>
  );
}
