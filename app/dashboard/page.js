// File: app/dashboard/page.js

"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore"; // Added updateDoc
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Library, Layers3, LogOut, CheckCircle, Settings, LayoutGrid, ListChecks } from "lucide-react"; // Added LayoutGrid, ListChecks
// Dialog, Input, Label, MultiSelect, and interestOptions are removed as they are no longer used here.

// This is the actual content component for the dashboard
const DashboardPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // Removed states: isEditing, editData, updateMessage, updateError, isUpdatingProfile
  // Removed handleProfileUpdate function
  // Removed useEffect that initialized editData

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
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4"> {/* Group for title and admin button */}
            {userProfile && <h1 className="text-xl font-bold">Dashboard - {userProfile.fullName}</h1>}
            {userProfile && userProfile.role === "admin" && (
              <Link href="/admin" passHref>
                <Button variant="outline" size="sm">
                  <Shield className="mr-2 h-4 w-4" /> Admin Panel
                </Button>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2"> {/* Reduced gap for icon buttons */}
            <Link href="/dashboard/settings" passHref>
              <Button variant="ghost" size="icon" aria-label="User Profile and Settings">
                <User className="h-5 w-5" /> {/* User icon now links to settings */}
              </Button>
            </Link>
            {/* Settings Icon is removed */}
            <Button onClick={handleLogout} variant="destructive" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Side Navbar */}
        <aside className="w-60 bg-background p-4 border-r space-y-2 sticky top-16 h-[calc(100vh-4rem)]">
          <nav className="flex flex-col space-y-1">
            <Link href="/dashboard" passHref>
              <Button variant="ghost" className="w-full justify-start">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Overview
              </Button>
            </Link>
            <Link href="/dashboard/activities" passHref>
              <Button variant="ghost" className="w-full justify-start">
                <ListChecks className="mr-2 h-4 w-4" />
                My Activities
              </Button>
            </Link>
            {/* Add more links as needed */}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-10 bg-secondary/50 overflow-y-auto h-[calc(100vh-4rem)]">
          <div className="container mx-auto">
            <div className="space-y-6">
              {/* Admin panel link is removed from here */}
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {/* Profile Information Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-primary">
                      <User className="mr-2" /> Your Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Full Name:</strong> {userProfile.fullName}</p>
                    <p><strong>Email:</strong> {userProfile.email}</p>
                    <p><strong>Register Number:</strong> {userProfile.registerNumber}</p>
                    <p><strong>Department:</strong> {userProfile.department}</p>
                    <p><strong>Year:</strong> {userProfile.year}</p>
                    <p><strong>Semester:</strong> {userProfile.semester}</p>
                    {userProfile.dob && <p><strong>Date of Birth:</strong> {userProfile.dob}</p>}
                    {userProfile.phone && <p><strong>Phone:</strong> {userProfile.phone}</p>}
                    {userProfile.address && <p><strong>Address:</strong> {userProfile.address}</p>}
                  </CardContent>
                </Card>

                {/* Interests Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <Layers3 /> Your Interests
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {userProfile.interests && userProfile.interests.length > 0 ? (
                      userProfile.interests.map(interest =>
                        <Badge key={interest} variant="secondary">
                          {interest}
                        </Badge>
                      )
                    ) : (
                      <p className="text-muted-foreground text-sm">No interests specified.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Placeholder Card for Future Features (My Activities) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <Library /> My Activities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Your event history, attendance, and certificates will appear here.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// The ProtectedRoute wrapper remains the same
const ProtectedDashboardPage = () =>
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>;

export default ProtectedDashboardPage;
