"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { auth } from '@/lib/firebase';
import { verifyPasswordResetCode, confirmPasswordReset, signInWithEmailAndPassword } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from 'next/link';

const passwordResetSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

function PasswordResetComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  const [step, setStep] = useState('verifying'); // verifying, form, success, error
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  const form = useForm({
    resolver: zodResolver(passwordResetSchema),
  });

  useEffect(() => {
    if (!oobCode) {
      setError("Invalid password reset link. No action code found.");
      setStep('error');
      return;
    }

    const verifyCode = async () => {
      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
        setStep('form');
      } catch (err) {
        console.error("Invalid password reset code:", err);
        setError("This password reset link is invalid or has expired. Please try again.");
        setStep('error');
      }
    };

    verifyCode();
  }, [oobCode]);

  const handlePasswordReset = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      await confirmPasswordReset(auth, oobCode, data.password);

      // After successful reset, sign in the user to get an auth token
      const userCredential = await signInWithEmailAndPassword(auth, email, data.password);
      if (userCredential.user) {
        // Now call the cloud function to set the password hash
        const functions = getFunctions();
        const setPassword = httpsCallable(functions, 'setPassword');
        await setPassword({ password: data.password });
      }

      setStep('success');
    } catch (err) {
      console.error("Error resetting password:", err);
      setError("Failed to reset password. The link may have expired or you may have entered an incorrect old password. Please try again.");
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'verifying':
        return <p>Verifying your link...</p>;
      case 'form':
        return (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handlePasswordReset)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl><Input type="password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl><Input type="password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </Form>
        );
      case 'success':
        return (
          <div className="text-center">
            <p className="text-green-600">Your password has been reset successfully!</p>
            <Button asChild className="mt-4">
              <Link href="/register/login">Back to Login</Link>
            </Button>
          </div>
        );
      case 'error':
        return (
          <div className="text-center">
            <p className="text-red-500">{error}</p>
            <Button asChild variant="secondary" className="mt-4">
              <Link href="/register/reset-password">Request a new link</Link>
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="blueprint-background flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Set a New Password</CardTitle>
          <CardDescription>
            {step === 'form' && "Please enter your new password below."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </main>
  );
}


export default function ActionHandlerPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
            <PasswordResetComponent />
        </Suspense>
    )
}
