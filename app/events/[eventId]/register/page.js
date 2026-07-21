"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoginModal from '@/components/auth/LoginModal';

const registrationFormSchema = z.object({
  userType: z.enum(["iedc-member", "carmel-student", "other-college"], { required_error: "Select student type." }),
  fullName: z.string().min(1, "Name is required."),
  email: z.string().email("Invalid email."),
  college: z.string().min(1, "College is required."),
  department: z.string().min(1, "Department is required."),
  semester: z.string().min(1, "Semester is required."),
  mobileNumber: z.string().min(10, "Valid mobile required."),
  paymentScreenshot: z.any().optional(), // We'll validate manually or check if payment is needed
});

export default function RegistrationPage() {
  const router = useRouter();
  const params = useParams();
  const { eventId } = params;
  const { user, loading: authLoading } = useAuth(); // AuthContext is already migrated

  const [event, setEvent] = useState(null);
  const [isEventLoading, setIsEventLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMember, setIsMember] = useState(false);

  const form = useForm({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      college: "Carmel Polytechnic College, Alappuzha",
      userType: "carmel-student",
    },
  });

  const selectedUserType = form.watch("userType");

  // Fetch Event Details
  useEffect(() => {
    const fetchEvent = async () => {
       setIsEventLoading(true);
       const { data, error } = await supabase.from('events').select('*').eq('id', eventId).single();
       if(data) setEvent(data);
       else console.error("Event fetch error:", error);
       setIsEventLoading(false);
    };
    if(eventId) fetchEvent();
  }, [eventId]);

  // Autofill for Logged In Users
  useEffect(() => {
    const fetchProfile = async () => {
         if(!user) return;
         const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
         if(data) {
             setIsMember(true); // Assuming if profile exists, they are somewhat internal or registered
             form.reset({
                 userType: 'iedc-member', // Default or derive from role
                 fullName: data.full_name,
                 email: data.email,
                 college: "Carmel Polytechnic College, Alappuzha",
                 department: data.department,
                 mobileNumber: data.phone,
                 semester: data.year ? `Year ${data.year}` : '', // Approximate
             });
         }
    };
    if(user && !isMember) fetchProfile();
  }, [user, isMember, form]);


  async function onSubmit(values) {
    setIsSubmitting(true);
    try {
      let screenshotUrl = "";
      
      // Upload Screenshot
      if (values.paymentScreenshot && values.paymentScreenshot[0]) {
          const file = values.paymentScreenshot[0];
          const fileExt = file.name.split('.').pop();
          const fileName = `${eventId}/${Date.now()}-${values.fullName}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('payment-screenshots')
            .upload(fileName, file);
          
          if (uploadError) throw uploadError;
          
          // Private bucket? We need a signed URL or if we made it public?
          // I made it private ('payment-screenshots', false).
          // So we should generate a signed URL OR just store the path and Admin can create signed URL?
          // Actually, let's just store the path or make it public. Making payment info public is bad.
          // Keep it private. Admin can view via Supabase or we implement Signed URL view in Admin.
          // For now, let's just store the *path* (fileName) and client can't view it freely.
          // Or generate a Signed URL valid for a long time?
          // Let's create a signed URL for the API to verify it?
          // Actually, `getPublicUrl` returns valid URL only if public.
          // `createSignedUrl` works.
          const { data: signedData } = await supabase.storage.from('payment-screenshots').createSignedUrl(fileName, 31536000); // 1 year
          screenshotUrl = signedData.signedUrl;
      }

      // Submit to API
      // We send userId if logged in
      const payload = {
          ...values,
          userId: user?.id,
      };
      delete payload.paymentScreenshot;

      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationData: payload, screenshotUrl }),
      });

      if (!response.ok) throw new Error("Registration API failed");

      alert("Successfully Registered!");
      router.push(`/events/${eventId}`);

    } catch (error) {
      console.error("Registration Error:", error);
      alert("Registration Failed: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isEventLoading || authLoading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <>
      <LoginModal isOpen={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
      
      <div className="container mx-auto px-4 py-10">
          <div className="max-w-2xl mx-auto">
              <h1 className="text-3xl font-bold mb-6">{event?.name} - Registration</h1>
              
              <Card>
                  <CardHeader><CardTitle>Fill your details</CardTitle></CardHeader>
                  <CardContent>
                      <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                  control={form.control}
                                  name="userType"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>User Type</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="iedc-member">IEDC Member</SelectItem>
                                            <SelectItem value="carmel-student">Carmel Student</SelectItem>
                                            <SelectItem value="other-college">Other College</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                {!user && (selectedUserType === 'iedc-member' || selectedUserType === 'carmel-student') && (
                                     <div className="bg-blue-50 p-4 rounded text-sm text-blue-800">
                                         Are you a Carmel student? <Button variant="link" onClick={() => setIsLoginModalOpen(true)}>Login to autofill</Button>
                                     </div>
                                )}

                                <FormField control={form.control} name="fullName" render={({field}) => <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>} />
                                <FormField control={form.control} name="email" render={({field}) => <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>} />
                                <FormField control={form.control} name="college" render={({field}) => <FormItem><FormLabel>College</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>} />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="department" render={({field}) => <FormItem><FormLabel>Department</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>} />
                                    <FormField control={form.control} name="semester" render={({field}) => <FormItem><FormLabel>Semester</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>} />
                                </div>
                                <FormField control={form.control} name="mobileNumber" render={({field}) => <FormItem><FormLabel>Mobile</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>} />

                                <FormField
                                  control={form.control}
                                  name="paymentScreenshot"
                                  render={({ field: { onChange, value, ...rest } }) => (
                                    <FormItem>
                                      <FormLabel>Payment Screenshot</FormLabel>
                                      <FormControl>
                                        <Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files)} {...rest} />
                                      </FormControl>
                                      <FormDescription>Upload .jpg/.png (Max 5MB)</FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? 'Registering...' : 'Submit Registration'}
                                </Button>
                          </form>
                      </Form>
                  </CardContent>
              </Card>
          </div>
      </div>
    </>
  );
}
