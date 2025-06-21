// File: app/login/page.js

"use client";
import Link from 'next/link';
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // We need Tabs now

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otpSent, setOtpSent] = useState(false);

  // Set up reCAPTCHA for phone auth
  useEffect(() => {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': (response) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });
  }, []);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('Login successful!');
      window.location.href = '/dashboard';
    } catch (error) {
      setError("Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

const handlePhoneLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      // THIS IS THE LINE TO FIX
      const formattedPhone = `+${phone.replace(/\D/g, '')}`; // Use backticks

      console.log(`Attempting to send OTP to: ${formattedPhone}`); // Add a log for debugging

      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setOtpSent(true);
      alert('OTP has been sent to your phone.');
    } catch (error) {
      console.error("SMS Error:", error);
      // Check the new error message from Firebase
      if (error.code === 'auth/invalid-phone-number') {
        setError("Invalid phone number format. Please check and try again.");
      } else {
        setError("Failed to send OTP. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOtpVerify = async () => {
    if (!otp || !confirmationResult) {
        setError("Please enter the OTP.");
        return;
    }
    setIsLoading(true);
    setError("");
    try {
        await confirmationResult.confirm(otp);
        alert('Login successful!');
        window.location.href = '/dashboard';
    } catch (error) {
        console.error("OTP Error:", error);
        setError("Invalid OTP. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

return (
  <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
    <div className='px-4 w-full flex justify-center flex-col items-center'>
      <Card className="w-[500px] max-w-full sm:max-w-md md:max-w-lg shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">IEDC Login</CardTitle>
          <CardDescription>Choose your login method</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>

            {/* --- Email Login --- */}
            <TabsContent value="email">
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleEmailLogin} disabled={isLoading}>
                  {isLoading ? 'Signing In...' : 'Sign In with Email'}
                </Button>
              </div>
            </TabsContent>

            {/* --- Phone Login --- */}
            <TabsContent value="phone">
              {!otpSent ? (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={handlePhoneLogin} disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send OTP'}
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="otp">Enter OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={handleOtpVerify} disabled={isLoading}>
                    {isLoading ? 'Verifying...' : 'Verify OTP & Sign In'}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {error && (
            <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
          )}

          {/* 🔐 reCAPTCHA container */}
          <div id="recaptcha-container"></div>
        </CardContent>
      </Card>

      <div className="mt-4 text-center text-sm">
        Don&apos;t have an account?{' '}
        <Link href="/" className="underline font-semibold">
          Register
        </Link>
      </div>
    </div>
  </main>
);
}