"use client";

import Link from 'next/link';
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export default function LoginPage() {
  const { user: authUser, loading: authLoading } = useAuth(); 
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!authLoading && authUser) {
      router.push('/dashboard');
    }
  }, [authUser, authLoading, router]);

  const handleLogin = async (values) => {
    setIsLoading(true);
    setError("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      router.push('/dashboard');
    } catch (err) {
      console.error("Error logging in:", err);
      setError(err.message || "Invalid login credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen">Checking session...</div>;
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm shadow-lg rounded-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">IEDC Login</CardTitle>
          <CardDescription>Enter your email and password to sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <Label>Email</Label>
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
                  <FormItem>
                    <Label>Password</Label>
                    <div className="relative">
                      <FormControl>
                        <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Enter your password" 
                            {...field} 
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="sr-only">Toggle password visibility</span>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
        {error && <p className="text-red-500 text-sm mb-4 text-center px-4">{error}</p>}
        <CardFooter className="flex flex-col gap-2 justify-center pb-6">
            <div className="text-center text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="underline font-semibold hover:text-primary">Register</Link>
            </div>
            <div className="text-center text-sm">
                <Link href="/register/reset-password" className="underline font-semibold hover:text-primary">Forgot password?</Link>
            </div>
        </CardFooter>
      </Card>
    </main>
  );
}