"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth } from '@/lib/firebase'; // Import auth for getting the token

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";


// 1. Define the validation schema with Zod
const eventFormSchema = z.object({
  name: z.string().min(3, { message: "Event name must be at least 3 characters long." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }).optional(),
  date: z.coerce.date({
    required_error: "A date for the event is required.",
  }),
  bypassTimeConstraint: z.boolean().default(false).optional(),
  askForInstagram: z.boolean().default(false).optional(),
  time: z.string().min(1, { message: "Time is required." }),
  endDate: z.coerce.date().optional(),
  endTime: z.string().optional(),
  venue: z.string().min(2, { message: "Venue is required." }),
  registrationFee: z.coerce.number().min(0, { message: "Fee cannot be negative." }).default(0),
  audience: z.enum([
    "iedc-members",
    "carmel-students",
    "all-students",
  ], { required_error: "You must select a target audience." }),
  banner: z.any().optional(), // Banner is optional on edit
}).refine(data => {
    if (data.endDate && data.date) {
        return data.endDate >= data.date;
    }
    return true;
}, {
    message: "End date must be on or after the start date.",
    path: ["endDate"],
}).refine(data => {
    if (data.date && data.endDate && data.date.getTime() === data.endDate.getTime() && data.endTime && data.time) {
        return data.endTime > data.time;
    }
    return true;
}, {
    message: "End time must be after the start time on the same day.",
    path: ["endTime"],
}).refine(data => {
    if (data.bypassTimeConstraint) {
        return true;
    }
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + twentyFourHoursInMs);
    return data.date > twentyFourHoursFromNow;
}, {
    message: "Event must be scheduled at least 24 hours in the future.",
    path: ["date"],
});


export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const { eventId } = params;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [event, setEvent] = useState(null);

  const form = useForm({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      bypassTimeConstraint: false,
      askForInstagram: false,
    },
  });

  useEffect(() => {
    if (!eventId || !auth.currentUser) return;
    const fetchEvent = async () => {
        try {
            const token = await auth.currentUser.getIdToken();
            const response = await fetch(`/api/admin/events/${eventId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch event data.');
            const eventData = await response.json();
            setEvent(eventData);

            const formatDateForInput = (dateString) => {
              if (!dateString) return '';
              const date = new Date(dateString);
              return date.toISOString().split('T')[0]; // YYYY-MM-DD
            }

            form.reset({
                ...eventData,
                date: formatDateForInput(eventData.date),
                endDate: eventData.endDate ? formatDateForInput(eventData.endDate) : '',
            });
        } catch (error) {
            console.error("Error fetching event for edit:", error);
        }
    };
    // Re-run if the user logs in
    if(auth.currentUser) fetchEvent();
  }, [eventId, form, auth.currentUser]);

  async function onSubmit(values) {
    setIsSubmitting(true);
    try {
      let bannerUrl = event.bannerUrl;
      if (values.banner && values.banner.length > 0) {
        const bannerFile = values.banner[0];
        const storage = getStorage();
        const storageRef = ref(storage, `event-banners/${Date.now()}-${bannerFile.name}`);
        const uploadResult = await uploadBytes(storageRef, bannerFile);
        bannerUrl = await getDownloadURL(uploadResult.ref);
      }

      const eventData = {
        ...values,
        bannerUrl,
        date: values.date.toISOString(),
        eventId,
      };
      if (values.endDate) {
        eventData.endDate = values.endDate.toISOString();
      }
      delete eventData.banner;

      if (!auth.currentUser) throw new Error("User not authenticated.");
      const token = await auth.currentUser.getIdToken();

      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update event.');
      }

      console.log("Event updated successfully!");
      router.push(`/admin/events/${eventId}`);

    } catch (error) {
      console.error("Error updating event:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!event) {
    return <div>Loading event data...</div>;
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Event</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* ... form fields are identical to create page ... */}
            {/* Event Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 'Intro to AI' Workshop" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Event Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the event, what participants will learn, prerequisites, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="banner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Event Banner (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      onChange={(e) => field.onChange(e.target.files)}
                    />
                  </FormControl>
                  <FormDescription>
                    Upload a new banner to replace the existing one. 16:9 aspect ratio recommended. Max size 10MB.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Event Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Event Time */}
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Event End Date */}
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Event End Time */}
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event End Time (Optional)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Venue */}
            <FormField
              control={form.control}
              name="venue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 'Seminar Hall' or 'Online'" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Registration Fee */}
                <FormField
                control={form.control}
                name="registrationFee"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Registration Fee (in INR)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="Enter 0 for free events" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                {/* Target Audience */}
                <FormField
                control={form.control}
                name="audience"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Target Audience</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select who can attend" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="iedc-members">IEDC Members Only</SelectItem>
                            <SelectItem value="carmel-students">All Carmel Students</SelectItem>
                            <SelectItem value="all-students">All Students (including other colleges)</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="bypassTimeConstraint"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Bypass 24-hour Rule
                    </FormLabel>
                    <FormDescription>
                      Allow creating an event that starts in less than 24 hours.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="askForInstagram"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Ask for Instagram Handle
                    </FormLabel>
                    <FormDescription>
                      Add an optional field for attendees to enter their Instagram handle during registration.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating Event...' : 'Update Event'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
