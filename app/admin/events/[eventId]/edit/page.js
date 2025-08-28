"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase';

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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon } from 'lucide-react';
import { format } from "date-fns";


// 1. Define the validation schema with Zod
const eventFormSchema = z.object({
  name: z.string().min(3, { message: "Event name must be at least 3 characters long." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }).optional(),
  date: z.date({
    required_error: "A date for the event is required.",
  }).refine(date => {
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + twentyFourHoursInMs);
    return date > twentyFourHoursFromNow;
  }, { message: "Event must be scheduled at least 24 hours in the future." }),
  time: z.string().min(1, { message: "Time is required." }),
  venue: z.string().min(2, { message: "Venue is required." }),
  registrationFee: z.coerce.number().min(0, { message: "Fee cannot be negative." }).default(0),
  audience: z.enum([
    "iedc-members",
    "carmel-students",
    "all-students",
  ], { required_error: "You must select a target audience." }),
  banner: z.any().optional(), // Banner is optional on edit
});


export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const { eventId } = params;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [event, setEvent] = useState(null);

  // 2. Define the form
  const form = useForm({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      description: "",
      time: "",
      venue: "",
      registrationFee: 0,
    },
  });

  useEffect(() => {
    if (!eventId) return;
    const fetchEvent = async () => {
        try {
            const functions = getFunctions();
            const getEvent = httpsCallable(functions, 'getEvent');
            const result = await getEvent({ eventId });
            const eventData = result.data;
            setEvent(eventData);
            form.reset({
                ...eventData,
                date: new Date(eventData.date),
            });
        } catch (error) {
            console.error("Error fetching event for edit:", error);
        }
    };
    fetchEvent();
  }, [eventId, form]);


  // 3. Define the submit handler
  async function onSubmit(values) {
    setIsSubmitting(true);
    try {
      let bannerUrl = event.bannerUrl;
      if (values.banner && values.banner.length > 0) {
        // 1. Upload new banner image to Firebase Storage
        const bannerFile = values.banner[0];
        const storage = getStorage();
        const storageRef = ref(storage, `event-banners/${Date.now()}-${bannerFile.name}`);
        const uploadResult = await uploadBytes(storageRef, bannerFile);
        bannerUrl = await getDownloadURL(uploadResult.ref);
      }

      // 2. Prepare data for the cloud function
      const eventData = {
        ...values,
        bannerUrl,
        date: values.date.toISOString(), // Convert date to string
        eventId,
      };
      delete eventData.banner;

      // 3. Call the 'updateEvent' cloud function
      const functions = getFunctions();
      const updateEvent = httpsCallable(functions, 'updateEvent');
      await updateEvent(eventData);

      // 4. Handle success
      console.log("Event updated successfully!");
      router.push(`/admin/events/${eventId}`);

    } catch (error) {
      console.error("Error updating event:", error);
      // TODO: Show user-friendly error message
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
                  <FormItem className="flex flex-col">
                    <FormLabel>Event Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() + 1))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                    <FormLabel>Event Time</FormLabel>
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

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating Event...' : 'Update Event'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
