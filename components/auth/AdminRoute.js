"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      // 1. Wait for AuthContext loading
      if (loading) return;

      // 2. If no user, redirect to login
      if (!user) {
        router.push('/register/login');
        return;
      }

      try {
        // 3. Check role in profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (data && data.role === 'admin') {
          setIsAdmin(true);
        } else {
          console.warn('User is not admin:', user.email);
          router.push('/dashboard');
        }
      } catch (err) {
        console.error("Admin check failed", err);
        router.push('/dashboard');
      } finally {
        setCheckingRole(false);
      }
    };

    checkAdmin();
  }, [user, loading, router]);

  if (loading || checkingRole) {
    return <div className="flex h-screen items-center justify-center">Verifying Admin Access...</div>;
  }

  return isAdmin ? <>{children}</> : null;
};

export default AdminRoute;