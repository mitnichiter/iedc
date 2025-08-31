"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { format } from 'date-fns';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionComponent } from "@/components/ui/card";
import LoginModal from '@/components/auth/LoginModal';

// Zod schema for the form
const registrationFormSchema = z.object({
  userType: z.enum(["iedc-member", "carmel-student", "other-college"], {
    required_error: "Please select your student type.",
  }),
  fullName: z.string().min(1, "Full name is required."),
  email: z.string().email("Invalid email address."),
  college: z.string().min(1, "College name is required."),
  department: z.string().min(1, "Department is required."),
  semester: z.string().min(1, "Semester is required."),
  mobileNumber: z.string().min(10, "A valid mobile number is required."),
  paymentScreenshot: z.any()
    .refine((files) => files?.length === 1, "Payment screenshot is required.")
    .refine((files) => files?.[0]?.size <= 5000000, `Max file size is 5MB.`),
});

export default function RegistrationPage() {
  const router = useRouter();
  const params = useParams();
  const { eventId } = params;
  const { user, loading: authLoading } = useAuth();

  const [event, setEvent] = useState(null);
  const [isEventLoading, setIsEventLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      college: "Carmel Polytechnic College, Alappuzha",
      userType: "carmel-student",
    },
  });

  const selectedUserType = form.watch("userType");

  const populateFormWithUserData = useCallback(async (currentUser) => {
    if(!currentUser) return;
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      form.reset({
        ...form.getValues(),
        userType: selectedUserType, // keep the selected user type
        fullName: userData.fullName,
        email: userData.email,
        department: userData.department,
        semester: userData.semester,
        mobileNumber: userData.phone,
        college: "Carmel Polytechnic College, Alappuzha",
      });
    }
  }, [form, selectedUserType]);

  useEffect(() => {
    if (!eventId) return;
    const fetchEvent = async () => {
      setIsEventLoading(true);
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      if (eventDoc.exists()) {
        setEvent(eventDoc.data());
      }
      setIsEventLoading(false);
    };
    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    if (user && (selectedUserType === 'iedc-member' || selectedUserType === 'carmel-student')) {
      populateFormWithUserData(user);
    }
  }, [user, selectedUserType, populateFormWithUserData]);

  async function onSubmit(values) {
    setIsSubmitting(true);
    try {
      const screenshotFile = values.paymentScreenshot[0];
      const storage = getStorage();
      const storageRef = ref(storage, `payment-screenshots/${eventId}/${Date.now()}-${values.fullName}`);
      const uploadResult = await uploadBytes(storageRef, screenshotFile);
      const screenshotUrl = await getDownloadURL(uploadResult.ref);

      const registrationData = { ...values };
      delete registrationData.paymentScreenshot;

      const functions = getFunctions();
      const registerForEvent = httpsCallable(functions, 'registerForEvent');
      await registerForEvent({ eventId, registrationData, screenshotUrl });

      alert("Registration successful! You will receive an email once your payment is verified.");
      router.push(`/events/${eventId}`);

    } catch (error) {
      console.error("Error submitting registration:", error);
      alert(`Registration failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  const isCarmelStudent = selectedUserType === 'iedc-member' || selectedUserType === 'carmel-student';

  if (isEventLoading || authLoading) {
    return <div className="container h-screen flex justify-center items-center">Loading...</div>
  }

  return (
    <>
      <LoginModal
        isOpen={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
        onLoginSuccess={() => populateFormWithUserData(auth.currentUser)}
      />
      <div className="container mx-auto px-4 py-12 md:py-20">
          {event?.bannerUrl && (
              <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden shadow-lg mb-8">
                  <Image
                  src={event.bannerUrl}
                  alt={`${event.name} banner`}
                  layout="fill"
                  objectFit="cover"
                  />
              </div>
          )}
          <div className="max-w-2xl mx-auto">
              <div className="mb-8">
                  <h1 className="text-3xl font-bold">{event?.name}</h1>
                  <p className="text-muted-foreground mt-2">{event?.description}</p>
              </div>
              <Card>
                  <CardHeader>
                  <CardTitle className="text-2xl">Registration Form</CardTitle>
                  </CardHeader>
                  <CardContent>
                  <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                          control={form.control}
                          name="userType"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>I am a...</FormLabel>
                              <Select onValueChange={(value) => {
                                field.onChange(value);
                                const isCarmel = value === 'carmel-student' || value === 'iedc-member';
                                form.reset({
                                    ...form.getValues(),
                                    college: isCarmel ? 'Carmel Polytechnic College, Alappuzha' : '',
                                });
                              }} defaultValue={field.value}>
                              <FormControl>
                                  <SelectTrigger><SelectValue placeholder="Select your student type" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  <SelectItem value="iedc-member">Member of IEDC Carmel</SelectItem>
                                  <SelectItem value="carmel-student">Student of Carmel (Non-Member)</SelectItem>
                                  {event?.audience === 'all-students' && (
                                    <SelectItem value="other-college">Student from another college</SelectItem>
                                  )}
                              </SelectContent>
                              </Select>
                              <FormMessage />
                          </FormItem>
                          )}
                      />

                      {isCarmelStudent && !user && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                            <p className="text-sm text-blue-800">It looks like you&apos;re a student at Carmel. Please log in to auto-fill your details.</p>
                            <Button type="button" variant="link" className="mt-2" onClick={() => setIsLoginModalOpen(true)}>
                                Login Now
                            </Button>
                        </div>
                      )}

                      <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} disabled={isCarmelStudent && user} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} disabled={isCarmelStudent && user} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="college" render={({ field }) => (<FormItem><FormLabel>College Name</FormLabel><FormControl><Input {...field} disabled={isCarmelStudent} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="department" render={({ field }) => (<FormItem><FormLabel>Department</FormLabel><FormControl><Input {...field} disabled={isCarmelStudent && user} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="semester" render={({ field }) => (<FormItem><FormLabel>Semester</FormLabel><FormControl><Input {...field} disabled={isCarmelStudent && user} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="mobileNumber" render={({ field }) => (<FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input {...field} disabled={isCarmelStudent && user} /></FormControl><FormMessage /></FormItem>)} />

                      <FormField
                          control={form.control}
                          name="paymentScreenshot"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>Payment Screenshot</FormLabel>
                              <FormControl>
                              <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} />
                              </FormControl>
                              <FormDescription>Upload a screenshot of your payment. Max 5MB.</FormDescription>
                              <FormMessage />
                          </FormItem>
                          )}
                      />

                      <Button type="submit" disabled={isSubmitting} className="w-full">
                          {isSubmitting ? 'Submitting...' : 'Submit Registration'}
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
