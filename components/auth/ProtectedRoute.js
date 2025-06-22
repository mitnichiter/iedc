// File: components/auth/ProtectedRoute.js
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't do anything while loading
    if (loading) {
      return;
    }

    // If loading is finished and there's no user, redirect to login
    if (!user) {
      router.push('/register/login');
    }
  }, [user, loading, router]); // Effect runs when user, loading, or router changes

  // If it's loading, show a simple loading message
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If there's a user, show the children (the protected page)
  if (user) {
    return <>{children}</>;
  }

  // If no user and not loading (should be redirecting), return null to prevent flash of content
  return null;
};

export default ProtectedRoute;