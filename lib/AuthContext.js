"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase'; // Import your Firebase auth instance

// Create the context
const AuthContext = createContext();

// Create a custom hook to use the context easily
export const useAuth = () => {
  return useContext(AuthContext);
};

// This is the component that will provide the auth state
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start with loading true

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const idTokenResult = await currentUser.getIdTokenResult();
          // Augment the user object with claims
          // @ts-ignore
          currentUser.customClaims = idTokenResult.claims;
          setUser(currentUser);
        } catch (error) {
          console.error("Error getting ID token result:", error);
          // Set user without claims if token fetching fails for some reason
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // The empty array means this effect runs only once on mount

  const value = {
    user,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};