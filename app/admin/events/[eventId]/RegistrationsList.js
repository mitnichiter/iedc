"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import Image from 'next/image';

function VerificationModal({ registration, onVerify }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = async (status) => {
    setIsUpdating(true);
    try {
      await onVerify(registration.id, status);
      // After successful verification, close the modal
      setIsOpen(false);
    } catch (error) {
      // The parent's handleVerify function already shows an alert.
      // We just need to ensure the loading state is turned off.
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>View & Verify</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Verify Registration for {registration.fullName}</DialogTitle>
          <DialogDescription>
            Review the payment screenshot and approve or reject the registration.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4">
            <h4 className="font-semibold mb-2">User Details:</h4>
            <ul>
                <li><strong>Email:</strong> {registration.email}</li>
                <li><strong>College:</strong> {registration.college}</li>
                <li><strong>Phone:</strong> {registration.mobileNumber}</li>
            </ul>
        </div>
        <div className="my-4">
          <h4 className="font-semibold mb-2">Payment Screenshot:</h4>
          <div className="relative w-full h-96">
            <Image src={registration.screenshotUrl} alt="Payment Screenshot" layout="fill" objectFit="contain" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isUpdating}>Close</Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={() => handleAction('rejected')}
            disabled={isUpdating}
          >
            {isUpdating ? 'Rejecting...' : 'Reject'}
          </Button>
          <Button
            type="button"
            onClick={() => handleAction('verified')}
            disabled={isUpdating}
          >
            {isUpdating ? 'Approving...' : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RegistrationsList({ eventId }) {
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchRegistrations = useCallback(async () => {
    setIsLoading(true);
    try {
      const functions = getFunctions();
      const getEventRegistrations = httpsCallable(functions, 'getEventRegistrations');
      const result = await getEventRegistrations({ eventId });
      setRegistrations(result.data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching registrations:", err);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      fetchRegistrations();
    }
  }, [eventId, fetchRegistrations]);

  const handleVerify = async (registrationId, status) => {
    try {
        const functions = getFunctions();
        const verifyRegistration = httpsCallable(functions, 'verifyRegistration');
        await verifyRegistration({ eventId, registrationId, newStatus: status });
        // Refresh the list after verification
        fetchRegistrations();
    } catch (error) {
        console.error("Error verifying registration:", error);
        alert(`Failed to verify registration: ${error.message}`);
    }
  };

  const filteredRegistrations = useMemo(() => {
    // Placeholder for filter logic
    return registrations;
  }, [registrations]);

  if (isLoading) {
    return <p>Loading registrations...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
    <div>
      {/* Filter buttons can be implemented later */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>College</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRegistrations.length > 0 ? (
            filteredRegistrations.map((reg) => (
              <TableRow key={reg.id}>
                <TableCell>{reg.fullName}</TableCell>
                <TableCell>{reg.email}</TableCell>
                <TableCell>{reg.college}</TableCell>
                <TableCell>
                  <Badge variant={
                    reg.status === 'verified' ? 'default' : reg.status === 'rejected' ? 'destructive' : 'secondary'
                  }>
                    {reg.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <VerificationModal registration={reg} onVerify={handleVerify} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No registrations yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
