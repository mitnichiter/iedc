"use client";

import { useState, useEffect, useMemo } from 'react';
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

export default function AttendeesList({ eventId }) {
  const [attendees, setAttendees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'iedc', 'carmel', 'outside'

  useEffect(() => {
    if (!eventId) return;

    const fetchAttendees = async () => {
      setIsLoading(true);
      try {
        const functions = getFunctions();
        const getEventAttendees = httpsCallable(functions, 'getEventAttendees');
        const result = await getEventAttendees({ eventId });
        setAttendees(result.data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching attendees:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendees();
  }, [eventId]);

  const filteredAttendees = useMemo(() => {
    if (filter === 'all') {
      return attendees;
    }
    // This is a simplified filter logic.
    // A more robust solution would depend on the user data structure.
    // Assuming user object has a 'type' or 'college' field.
    // For now, this is a placeholder for the filter logic.
    return attendees.filter(attendee => {
        if (filter === 'iedc') return attendee.isIedcMember; // Assuming this field exists
        if (filter === 'carmel') return attendee.college === 'Carmel Polytechnic College'; // Assuming this field exists
        if (filter === 'outside') return attendee.college !== 'Carmel Polytechnic College'; // Assuming this field exists
        return true;
    });
  }, [attendees, filter]);

  if (isLoading) {
    return <p>Loading attendees...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
    <div>
      <div className="flex items-center space-x-2 mb-4">
        <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
        <Button variant={filter === 'iedc' ? 'default' : 'outline'} onClick={() => setFilter('iedc')} disabled>IEDC Members</Button>
        <Button variant={filter === 'carmel' ? 'default' : 'outline'} onClick={() => setFilter('carmel')} disabled>Carmel Students</Button>
        <Button variant={filter === 'outside' ? 'default' : 'outline'} onClick={() => setFilter('outside')} disabled>Outside Students</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Year</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAttendees.length > 0 ? (
            filteredAttendees.map((attendee) => (
              <TableRow key={attendee.id}>
                <TableCell>{attendee.fullName}</TableCell>
                <TableCell>{attendee.email}</TableCell>
                <TableCell>{attendee.department}</TableCell>
                <TableCell>{attendee.year}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                No attendees found for this filter.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
