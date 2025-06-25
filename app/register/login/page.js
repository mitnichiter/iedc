// File: app/login/page.js

"use client";
import Link from 'next/link';
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
// We still need useAuth for the initial loading check, but not for the redirect effect
import { useAuth } from '@/lib/AuthContext';
import { app, auth } from "@/lib/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
// Import the session management tools
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence, browserLocalPersistence } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function LoginPage() {
  const { user: authUser, loading: authLoading } = useAuth(); 
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [pendingUser, setPendingUser] = useState(null); 
  const [loginStep, setLoginStep] = useState("credentials");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const functions = getFunctions(app);

  useEffect(() => {
    // If auth state is resolved, not loading, and user is logged in, redirect to dashboard
    if (!authLoading && authUser) {
      router.push('/dashboard');
    }
  }, [authUser, authLoading, router]);

  const handleCredentialLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      // Set persistence to SESSION to prevent the global auth state from changing permanently
      await setPersistence(auth, browserSessionPersistence);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setPendingUser(userCredential.user);

      const sendOtp = httpsCallable(functions, 'sendEmailOtp');
      await sendOtp({});
      
      setLoginStep("otp"); // This will now work without being interrupted
    } catch (error) {
      console.error("Credential Login Error:", error);
      setError("Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerification = async () => {
    if (!pendingUser) {
      setError("User session lost. Please start over.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const verifyOtp = httpsCallable(functions, 'verifyEmailOtp');
      await verifyOtp({ userId: pendingUser.uid, otp });

      // Upgrade the session to be permanent
      await setPersistence(auth, browserLocalPersistence);

      // ✅ KEY CHANGE #2: The redirect is now MANUAL and EXPLICIT.
      // It only happens after the OTP is verified.
      router.push('/dashboard');

    } catch (error) {
      console.error("OTP Verification Error:", error);
      setError("Invalid or expired OTP. Please try again.");
      auth.signOut();
      setLoginStep('credentials');
      setPendingUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // We keep this block to prevent the form from flashing for users who are already logged in
  // and are just navigating back to the login page by mistake. They'll see this loading
  // screen, and can just navigate away.
  if (authLoading) {
    return <div className="flex items-center justify-center h-screen bg-background blueprint-background">Checking session...</div>;
  }

  return (
    <main className="blueprint-background flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm shadow-lg rounded-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">IEDC Login</CardTitle>
          <CardDescription>
            {loginStep === 'credentials' ? "Sign in to continue." : "We&apos;ve sent a code to your email."}
          </CardDescription>
        </CardHeader>
        {loginStep === 'credentials' ? (
          <CardContent className="grid gap-4">
            <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          </CardContent>
        ) : (
          <CardContent className="grid gap-4">
            <div className="grid gap-2"><Label htmlFor="otp">Verification Code</Label><Input id="otp" type="text" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} /></div>
          </CardContent>
        )}
        <CardFooter>
          {loginStep === 'credentials' ? (
            <Button className="w-full" onClick={handleCredentialLogin} disabled={isLoading}>{isLoading ? "Checking..." : "Continue"}</Button>
          ) : (
            <Button className="w-full" onClick={handleOtpVerification} disabled={isLoading}>{isLoading ? "Verifying..." : "Verify & Sign In"}</Button>
          )}
        </CardFooter>
      </Card>
      {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
      <div className="mt-4 text-center text-sm">
        Don&apos;t have an account?{' '}<Link href="/register" className="underline font-semibold">Register</Link>
      </div>
      <div className="mt-2 text-center text-sm">
        <Link href="/register/reset-password" पासclassName="underline font-semibold">Forgot password?</Link>
      </div>
    </main>
  );
}