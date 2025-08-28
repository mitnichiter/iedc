"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
  otp: z.string().optional(),
});

export default function LoginModal({ isOpen, onOpenChange, onLoginSuccess }) {
  const [step, setStep] = useState('credentials'); // 'credentials', 'otp'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const form = useForm({
    resolver: zodResolver(loginSchema),
  });

  const handleSendOtp = async () => {
    const email = form.getValues('email');
    const password = form.getValues('password');

    if (!email || !password) {
        form.trigger(['email', 'password']);
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const functions = getFunctions();
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
    setError(null);
    try {
      const functions = getFunctions();
      const login = httpsCallable(functions, 'loginWithPasswordAndOtp');
      const result = await login({ email: values.email, password: values.password, otp: values.otp });

      const token = result.data.token;
      await signInWithCustomToken(auth, token);

      onLoginSuccess();
      onOpenChange(false); // Close the modal
    } catch (err) {
      console.error("Error logging in:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Login to Continue</DialogTitle>
          <DialogDescription>
            {step === 'credentials'
              ? "Enter your email and password to login."
              : `Enter the OTP sent to ${form.getValues('email')}`}
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</p>}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
            <div style={{ display: step === 'credentials' ? 'block' : 'none' }}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1 mt-4">
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {step === 'otp' && (
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>One-Time Password</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {step === 'credentials' ? (
              <Button type="button" onClick={handleSendOtp} disabled={isLoading} className="w-full">
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            )}
          </form>
        </Form>

        {step === 'otp' && (
            <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => { setStep('credentials'); setError(null); }}>
                Back to login
            </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
