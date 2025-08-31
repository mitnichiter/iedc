// File: components/auth/AdminRoute.js
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const AdminRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Don't do anything while auth is loading
    if (authLoading) {
      return;
    }

    // If auth is done and there's no user, redirect immediately
    if (!user) {
      router.push('/login');
      return;
    }

    // If we have a user, check their role in Firestore
    const verifyAdminStatus = async () => {
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);
      
      // Reverted: Check if the role is 'admin'
      if (docSnap.exists() && docSnap.data().role === 'admin') {
        setIsAdmin(true);
      } else {
        // Not an admin, redirect them to their user dashboard
        console.warn("Access Denied: User is not an admin.");
        router.push('/dashboard');
      }
      setIsVerifying(false);
    };

    verifyAdminStatus();

  }, [user, authLoading, router]);

  // Show a loading screen while we verify the admin role
  if (isVerifying) {
    return <div className="flex items-center justify-center h-screen">Verifying Admin Access...</div>;
  }

  // If verification is done and they are an admin, show the admin page
  if (isAdmin) {
    return <>{children}</>;
  }

  // Otherwise, render nothing as a fallback while redirecting
  return null;
};

export default AdminRoute;