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
  DialogFooter,
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

const emailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

const otpSchema = z.object({
  otp: z.string().min(6, { message: "OTP must be 6 digits." }),
});

export default function LoginModal({ isOpen, onOpenChange, onLoginSuccess }) {
  const [step, setStep] = useState('email'); // 'email', 'otp'
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);

  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
  });

  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
  });

  const handleSendOtp = async (values) => {
    setIsSendingOtp(true);
    setError(null);
    try {
      const functions = getFunctions();
      const sendOtp = httpsCallable(functions, 'sendRegistrationEmailOtp');
      await sendOtp({ email: values.email });
      setEmail(values.email);
      setStep('otp');
    } catch (err) {
      console.error("Error sending OTP:", err);
      setError(err.message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (values) => {
    setIsVerifying(true);
    setError(null);
    try {
      const functions = getFunctions();
      const loginWithOtp = httpsCallable(functions, 'loginWithOtp');
      const result = await loginWithOtp({ email, otp: values.otp });

      const token = result.data.token;
      await signInWithCustomToken(auth, token);

      onLoginSuccess();
      onOpenChange(false); // Close the modal
    } catch (err) {
      console.error("Error verifying OTP:", err);
      setError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Login to Continue</DialogTitle>
          <DialogDescription>
            {step === 'email'
              ? "Enter your email to receive a one-time password (OTP)."
              : `Enter the OTP sent to ${email}`}
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</p>}

        {step === 'email' ? (
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(handleSendOtp)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSendingOtp} className="w-full">
                {isSendingOtp ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
              <FormField
                control={otpForm.control}
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
              <Button type="submit" disabled={isVerifying} className="w-full">
                {isVerifying ? 'Verifying...' : 'Login'}
              </Button>
            </form>
          </Form>
        )}

        {step === 'otp' && (
            <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => { setStep('email'); setError(null); }}>
                Use a different email
            </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
