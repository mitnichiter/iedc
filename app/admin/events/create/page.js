"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const eventFormSchema = z.object({
  name: z.string().min(3, { message: "Event name must be at least 3 characters long." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }).optional(),
  date: z.string().min(1, "Date is required"), // Keep as string for input type="date"
  time: z.string().min(1, { message: "Time is required." }),
  location: z.string().min(2, { message: "Location is required." }),
  banner: z.any().optional(), // File handling manually
});

export default function CreateEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      description: "",
      time: "",
      location: "",
      date: ""
    },
  });

  async function onSubmit(values) {
    setIsSubmitting(true);
    try {
      let imageUrl = "";

      // 1. Upload Image if present
      const file = values.banner?.[0];
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { data, error: uploadError } = await supabase.storage
          .from('events')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        
        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('events')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      // 2. Combine Date and Time
      // values.date is 'YYYY-MM-DD', values.time is 'HH:MM'
      const dateTimeString = `${values.date}T${values.time}:00`;
      const eventDate = new Date(dateTimeString).toISOString();

      // 3. Insert Event
      const { error: insertError } = await supabase.from('events').insert({
        name: values.name,
        description: values.description,
        date: eventDate,
        location: values.location,
        image_url: imageUrl,
        created_at: new Date().toISOString()
      });

      if (insertError) throw insertError;

      console.log("Event created successfully!");
      router.push('/admin/events');

    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Event</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Event Name" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Event details..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Date</FormLabel>
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
                    <FormLabel>Time</FormLabel>
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
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location / Venue</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Auditorium" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="banner"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel>Banner Image (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => onChange(e.target.files)} 
                        {...rest}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
