// File: app/login/page.js

"use client";
import Link from 'next/link';
import { useState } from "react";
import { app,auth } from "@/lib/firebase"; // Keep auth
import { getFunctions, httpsCallable } from "firebase/functions"; // Import functions
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth"; // Keep auth functions
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [user, setUser] = useState(null); // To store the user object after password auth

  const [loginStep, setLoginStep] = useState("credentials"); // 'credentials' or 'otp'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const functions = getFunctions(app);

// In app/login/page.js

const handleCredentialLogin = async () => {
    setIsLoading(true);
    setError("");

    // --- DEBUGGING STEP ---
    // Log the exact values being sent to Firebase
    console.log("Attempting to sign in with:");
    console.log("Email:", email);
    console.log("Password:", password);
    // --- END DEBUGGING STEP ---

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);

      // Call the cloud function to send OTP
      const sendOtp = httpsCallable(functions, 'sendEmailOtp');
      // app/login/page.js - NEW LINE
    await sendOtp({}); // Call with an empty object, as the backend gets info from the context

      setLoginStep("otp");
    } catch (error) {
      // --- DEBUGGING STEP ---
      // Log the actual error from Firebase
      console.error("Firebase Auth Error:", error.code, error.message);
      // --- END DEBUGGING STEP ---

      setError("Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
};

  const handleOtpVerification = async () => {
    setIsLoading(true);
    setError("");
    try {
        const verifyOtp = httpsCallable(functions, 'verifyEmailOtp');
        await verifyOtp({ userId: user.uid, otp });

        alert("Login successful! Welcome.");
        window.location.href = '/dashboard';
    } catch (error) {
        setError("Invalid or expired OTP. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-sm shadow-lg rounded-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">IEDC Login</CardTitle>
          <CardDescription>
            {loginStep === 'credentials' ? "Sign in with your email and password." : "We've sent a code to your email."}
          </CardDescription>
        </CardHeader>

        {loginStep === 'credentials' ? (
          // --- Step 1: Credentials ---
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </CardContent>
        ) : (
          // --- Step 2: OTP ---
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input id="otp" type="text" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} />
            </div>
          </CardContent>
        )}

        <CardFooter>
          {loginStep === 'credentials' ? (
            <Button className="w-full" onClick={handleCredentialLogin} disabled={isLoading}>
              {isLoading ? 'Checking...' : 'Continue'}
            </Button>
          ) : (
            <Button className="w-full" onClick={handleOtpVerification} disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify & Sign In'}
            </Button>
          )}
        </CardFooter>
      </Card>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      
      <div className="mt-4 text-center text-sm">
        Don't have an account?{' '}
        <Link href="/register" className="underline font-semibold">
          Register
        </Link>
      </div>
    </main>
  );
}