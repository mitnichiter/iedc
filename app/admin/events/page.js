"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';

export default function EventsPage() {
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
          <p className="text-muted-foreground">
            A list of all created events will be displayed here.
          </p>
          {/* TODO: Implement a table to display events */}
        </CardContent>
      </Card>
    </div>
  );
}
