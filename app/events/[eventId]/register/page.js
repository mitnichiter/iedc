"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

// Zod schema for the form
const registrationFormSchema = z.object({
  userType: z.enum(["carmel-student", "other-college"], {
    required_error: "Please select your student type.",
  }),
  registerNumber: z.string().optional(),
  fullName: z.string().min(1, "Full name is required."),
  email: z.string().email("Invalid email address."),
  college: z.string().min(1, "College name is required."),
  department: z.string().min(1, "Department is required."),
  semester: z.string().min(1, "Semester is required."),
  mobileNumber: z.string().min(10, "A valid mobile number is required."),
  paymentScreenshot: z.any()
    .refine((files) => files?.length === 1, "Payment screenshot is required.")
    .refine((files) => files?.[0]?.size <= 5000000, `Max file size is 5MB.`),
}).refine(data => {
    if (data.userType === 'carmel-student' && !data.registerNumber) {
        return false;
    }
    return true;
}, {
    message: "Register number is required for Carmel students.",
    path: ["registerNumber"],
});

export default function RegistrationPage() {
  const router = useRouter();
  const params = useParams();
  const { eventId } = params;

  const [event, setEvent] = useState(null);
  const [isEventLoading, setIsEventLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const form = useForm({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      college: "Carmel Polytechnic College, Alappuzha",
    },
  });

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

  const handleFetchDetails = async () => {
    const regNo = form.getValues("registerNumber");
    if (!regNo) {
      form.setError("registerNumber", { type: "manual", message: "Please enter a register number first." });
      return;
    }
    setIsFetchingDetails(true);
    try {
      const userDoc = await getDoc(doc(db, "users", regNo));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        form.reset({
          ...form.getValues(),
          fullName: userData.fullName,
          email: userData.email,
          department: userData.department,
          semester: userData.semester,
          mobileNumber: userData.phone,
        });
      } else {
        form.setError("registerNumber", { type: "manual", message: "No student found with this register number." });
      }
    } catch (error) {
      console.error("Error fetching user data by register number:", error);
      form.setError("registerNumber", { type: "manual", message: "Could not fetch details. Please try again." });
    } finally {
      setIsFetchingDetails(false);
    }
  };

  async function onSubmit(values) {
    setIsSubmitting(true);
    try {
      const screenshotFile = values.paymentScreenshot[0];
      const storage = getStorage();
      const storageRef = ref(storage, `payment-screenshots/${eventId}/${Date.now()}-${screenshotFile.name}`);
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

  const selectedUserType = form.watch("userType");

  if (isEventLoading) {
    return <div className="container h-screen flex justify-center items-center">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Register for: {event?.name}</CardTitle>
          <CardDescriptionComponent>
            {event ? `on ${format(event.date.toDate(), 'PPP')} at ${event.venue}` : 'Loading event details...'}
          </CardDescriptionComponent>
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
                      form.reset({
                        ...form.getValues(),
                        college: value === 'carmel-student' ? 'Carmel Polytechnic College, Alappuzha' : '',
                      });
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select your student type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="carmel-student">Student of Carmel Polytechnic</SelectItem>
                        <SelectItem value="other-college">Student from another college</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedUserType === 'carmel-student' && (
                <FormField
                  control={form.control}
                  name="registerNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Register Number</FormLabel>
                      <div className="flex w-full items-center space-x-2">
                        <FormControl>
                          <Input placeholder="Enter your college register number" {...field} />
                        </FormControl>
                        <Button type="button" onClick={handleFetchDetails} disabled={isFetchingDetails}>
                          {isFetchingDetails ? 'Fetching...' : 'Fetch Details'}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="college" render={({ field }) => (<FormItem><FormLabel>College Name</FormLabel><FormControl><Input {...field} disabled={selectedUserType === 'carmel-student'} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="department" render={({ field }) => (<FormItem><FormLabel>Department</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="semester" render={({ field }) => (<FormItem><FormLabel>Semester</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="mobileNumber" render={({ field }) => (<FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />

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
  );
}
