"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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
  registration_fee: z.coerce.number().min(0, { message: "Fee cannot be negative." }).default(0), // Changed to snake_case to match DB
  audience: z.enum([
    "iedc-members",
    "carmel-students",
    "all-students",
  ], { required_error: "You must select a target audience." }),
  banner: z.any().optional(), 
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
    if (!eventId) return;
    const fetchEvent = async () => {
        try {
            const { data, error } = await supabase
              .from('events')
              .select('*')
              .eq('id', eventId)
              .single();

            if (error) throw error;
            setEvent(data);

            const formatDateForInput = (dateString) => {
              if (!dateString) return '';
              const date = new Date(dateString);
              return date.toISOString().split('T')[0]; // YYYY-MM-DD
            }

            form.reset({
                ...data,
                date: formatDateForInput(data.date),
                endDate: data.end_date ? formatDateForInput(data.end_date) : '',
                endTime: data.end_time || '',
                registration_fee: data.registration_fee || 0,
            });
        } catch (error) {
            console.error("Error fetching event for edit:", error);
        }
    };
    fetchEvent();
  }, [eventId, form]);

  async function onSubmit(values) {
    setIsSubmitting(true);
    try {
      let image_url = event.image_url;

      if (values.banner && values.banner.length > 0) {
        const bannerFile = values.banner[0];
        const fileName = `${Date.now()}-${bannerFile.name}`;
        
        const { error: uploadError } = await supabase.storage
            .from('events')
            .upload(fileName, bannerFile);
        
        if(uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('events')
            .getPublicUrl(fileName);
        
        image_url = publicUrl;
      }

      const eventData = {
        name: values.name,
        description: values.description,
        date: values.date.toISOString(),
        time: values.time,
        venue: values.venue,
        registration_fee: values.registration_fee,
        audience: values.audience,
        image_url: image_url,
        end_date: values.endDate ? values.endDate.toISOString() : null,
        end_time: values.endTime || null,
        bypass_time_constraint: values.bypassTimeConstraint,
        ask_for_instagram: values.askForInstagram
      };

      const { error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', eventId);

      if (error) throw error;

      console.log("Event updated successfully!");
      router.push(`/admin/events/${eventId}`);

    } catch (error) {
      console.error("Error updating event:", error);
      alert(`Failed to update event: ${error.message}`);
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the event..." {...field} />
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

            <FormField
              control={form.control}
              name="venue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 'Seminar Hall'" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                control={form.control}
                name="registration_fee"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Registration Fee (in INR)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

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
                            <SelectItem value="all-students">All Students</SelectItem>
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
