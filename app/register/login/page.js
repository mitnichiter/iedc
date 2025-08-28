"use client";

import Link from 'next/link';
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/AuthContext';
import { app, auth } from "@/lib/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { signInWithCustomToken } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
  otp: z.string().optional(),
});

export default function LoginPage() {
  const { user: authUser, loading: authLoading } = useAuth(); 
  const router = useRouter();

  const [step, setStep] = useState('credentials');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const form = useForm({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!authLoading && authUser) {
      router.push('/dashboard');
    }
  }, [authUser, authLoading, router]);

  const handleSendOtp = async () => {
    const email = form.getValues('email');
    const password = form.getValues('password');

    if (!email || !password) {
        form.trigger(['email', 'password']);
        return;
    }

    setIsLoading(true);
    setError("");
    try {
      const functions = getFunctions(app);
      const sendOtp = httpsCallable(functions, 'sendLoginOtp');
      await sendOtp({ email });
      setStep('otp');
    } catch (err) {
      console.error("Error sending OTP:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (values) => {
    setIsLoading(true);
    setError("");
    try {
      const functions = getFunctions(app);
      const login = httpsCallable(functions, 'loginWithPasswordAndOtp');
      const result = await login({ email: values.email, password: values.password, otp: values.otp });

      const token = result.data.token;
      await signInWithCustomToken(auth, token);

      router.push('/dashboard');
    } catch (err) {
      console.error("Error logging in:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen bg-background blueprint-background">Checking session...</div>;
  }

  return (
    <main className="blueprint-background flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm shadow-lg rounded-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">IEDC Login</CardTitle>
          <CardDescription>
            {step === 'credentials' ? "Sign in to continue." : `We've sent a code to your email.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
              {step === 'credentials' && (
                <div className="space-y-4">
                  <FormField control={form.control} name="email" render={({ field }) => (<FormItem><Label>Email</Label><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="password" render={({ field }) => (<FormItem><Label>Password</Label><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              )}

              {step === 'otp' && (
                <FormField control={form.control} name="otp" render={({ field }) => (<FormItem><Label>Verification Code</Label><FormControl><Input type="text" placeholder="123456" {...field} /></FormControl><FormMessage /></FormItem>)} />
              )}

              <CardFooter className="p-0 pt-4">
                {step === 'credentials' ? (
                  <Button type="button" className="w-full" onClick={handleSendOtp} disabled={isLoading}>{isLoading ? "Checking..." : "Continue"}</Button>
                ) : (
                  <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Verifying..." : "Verify & Sign In"}</Button>
                )}
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
      {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
      <div className="mt-4 text-center text-sm">
        Don&apos;t have an account?{' '}<Link href="/register" className="underline font-semibold">Register</Link>
      </div>
      <div className="mt-2 text-center text-sm">
        <Link href="/register/reset-password" className="underline font-semibold">Forgot password?</Link>
      </div>
    </main>
  );
}