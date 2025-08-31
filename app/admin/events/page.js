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
import { PlusCircle, MoreHorizontal, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";


export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const router = useRouter();

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

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDeleteClick = (event) => {
    setSelectedEvent(event);
    setShowDeleteDialog(true);
  };

  const handleViewParticipants = async (event) => {
    setSelectedEvent(event);
    setIsLoadingParticipants(true);
    setShowParticipantsModal(true);
    try {
        const functions = getFunctions();
        const getEventRegistrations = httpsCallable(functions, 'getEventRegistrations');
        const result = await getEventRegistrations({ eventId: event.id });
        const verifiedRegistrations = result.data.filter(reg => reg.status === 'verified');
        setParticipants(verifiedRegistrations);
    } catch (err) {
        console.error("Error fetching participants:", err);
        // TODO: show error in modal
    } finally {
        setIsLoadingParticipants(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedEvent) return;
    setIsDeleting(true);
    try {
      const functions = getFunctions();
      const deleteEvent = httpsCallable(functions, 'deleteEvent');
      await deleteEvent({ eventId: selectedEvent.id });
      fetchEvents(); // Refresh the list
    } catch (err) {
      console.error("Error deleting event:", err);
      // TODO: Show error toast
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setSelectedEvent(null);
    }
  };

  return (
    <>
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
                    <TableHead>Registrations</TableHead>
                    <TableHead>Participants</TableHead>
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
                        <TableCell>{event.registrationCount || 0}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => handleViewParticipants(event)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
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
                              <DropdownMenuItem onClick={() => router.push(`/admin/events/${event.id}`)}>
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/admin/events/${event.id}/edit`)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-500"
                                onClick={() => handleDeleteClick(event)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              event &apos;{selectedEvent?.name}&apos; and all of its registration data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showParticipantsModal} onOpenChange={setShowParticipantsModal}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Verified Participants for {selectedEvent?.name}</DialogTitle>
            </DialogHeader>
            {isLoadingParticipants ? (
                <p>Loading participants...</p>
            ) : (
                <div className="max-h-96 overflow-y-auto">
                    {participants.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>College</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {participants.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell>{p.fullName}</TableCell>
                                        <TableCell>{p.email}</TableCell>
                                        <TableCell>{p.college}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p>No verified participants yet.</p>
                    )}
                </div>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}
