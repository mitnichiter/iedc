"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if we have a session (Supabase automatically handles the hash fragment token exchange)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // If no session, they might have lost the link or it expired
        // But initially, supabase-js should recover the session from the URL hash
         // console.warn("No active session found on update-password page.");
      }
    };
    checkSession();
  }, []);

  const handleUpdatePassword = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      const { error } = await supabase.auth.updateUser({ password: password });
      if (error) throw error;
      
      setMessage("Password updated successfully! Redirecting to dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error updating password:", error);
      setError(error.message || "Failed to update password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="blueprint-background flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm shadow-lg rounded-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Update Password</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="password">New Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" onClick={handleUpdatePassword} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Password"}
          </Button>
          {message && <p className="text-green-500 text-sm text-center">{message}</p>}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </CardFooter>
      </Card>
    </main>
  );
}
