// File: app/dashboard/page.js

"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Library, Layers3, LogOut, CheckCircle } from "lucide-react";

// This is the actual content component for the dashboard
const DashboardPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ This effect runs when the component mounts to fetch the user's profile
  useEffect(
    () => {
      const fetchUserProfile = async () => {
        if (user) {
          // Create a reference to the user's document in Firestore using their UID
          const userDocRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            // If the document exists, store its data in our state
            setUserProfile(docSnap.data());
          } else {
            console.error("No profile document found for this user!");
            // Optional: handle cases where a user exists in Auth but not Firestore
          }
          setIsLoading(false);
        }
      };

      fetchUserProfile();
    },
    [user]
  ); // The effect depends on the user object being available

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  // Show a loading state while fetching the profile
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        Loading Your Profile...
      </div>
    );
  }

  // If no profile was found after loading, show an error
  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        Could not load profile data.
      </div>
    );
  }

  // Once data is loaded, display the full dashboard
  return (
    <div className="flex flex-col min-h-screen bg-secondary/50">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <h1 className="text-xl font-bold">My Dashboard</h1>
          <Button onClick={handleLogout} variant="destructive" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8">
        <div className="container mx-auto">
          <div className="space-y-4">
            {/* ✅ Personal Welcome Message */}
            <h2 className="text-3xl font-bold tracking-tight">
              Welcome back, {userProfile.fullName}!
            </h2>
            {userProfile.role === "admin" &&
              <Link href="/admin" className="inline-flex items-center">
                <Button>
                  <Shield/> Go to Admin Panel
                </Button>
              </Link>}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* ✅ Profile Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <User /> Your Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    <strong>Email:</strong> {userProfile.email}
                  </p>
                  <p>
                    <strong>Department:</strong> {userProfile.department}
                  </p>
                  <p>
                    <strong>Year:</strong> {userProfile.year}
                  </p>
                  <p>
                    <strong>Semester:</strong> {userProfile.semester}
                  </p>
                </CardContent>
              </Card>

              {/* ✅ Interests Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Layers3 /> Your Interests
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {userProfile.interests.map(interest =>
                    <Badge key={interest} variant="secondary">
                      {interest}
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* ✅ Placeholder Card for Future Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Library /> My Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Your event history, attendance, and certificates will appear
                    here.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// The ProtectedRoute wrapper remains the same, ensuring only logged-in users can see this
const ProtectedDashboardPage = () =>
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>;

export default ProtectedDashboardPage;
