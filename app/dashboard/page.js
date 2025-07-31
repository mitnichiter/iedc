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
import { Shield, User, Library, Layers3, LogOut, LayoutGrid, ListChecks, Menu, Settings } from "lucide-react"; // Added Menu, Settings
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

// This is the actual content component for the dashboard
const DashboardPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(
    () => {
      const fetchUserProfile = async () => {
        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          } else {
            console.error("No profile document found for this user!");
          }
          setIsLoading(false);
        }
      };

      fetchUserProfile();
    },
    [user]
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  // Nav links for mobile (with SheetClose)
  const mobileNavLinks = (
    <>
      <Link href="/dashboard" passHref>
        <SheetClose asChild>
          <Button variant="ghost" className="w-full justify-start">
            <LayoutGrid className="mr-2 h-4 w-4" />
            Overview
          </Button>
        </SheetClose>
      </Link>
      <Link href="/dashboard/activities" passHref>
        <SheetClose asChild>
          <Button variant="ghost" className="w-full justify-start">
            <ListChecks className="mr-2 h-4 w-4" />
            My Activities
          </Button>
        </SheetClose>
      </Link>
      <Link href="/dashboard/settings" passHref>
        <SheetClose asChild>
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </SheetClose>
      </Link>
      {/* Add more links as needed */}
    </>
  );

  // Nav links for desktop (without SheetClose)
  const desktopNavLinks = (
    <>
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
      <Link href="/dashboard/settings" passHref>
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </Link>
      {/* Add more links as needed */}
    </>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        Loading Your Profile...
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        Could not load profile data.
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            {/* Hamburger menu for mobile */}
            <div className="md:hidden">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-60 p-4 pt-10">
                  <nav className="flex flex-col space-y-1">
                    {mobileNavLinks}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
            {userProfile && <h1 className="text-xl font-bold">Dashboard</h1>}
          </div>
          <div className="flex items-center gap-2">
            {userProfile && userProfile.role === "admin" && (
              <Link href="/admin" passHref>
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <Shield className="mr-2 h-4 w-4" /> Admin Panel
                </Button>
              </Link>
            )}
            <Link href="/dashboard/settings" passHref>
              <Button variant="ghost" size="icon" aria-label="User Profile and Settings" className="hidden sm:flex">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <Button onClick={handleLogout} variant="destructive" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Side Navbar - hidden on mobile */}
        <aside className="hidden md:block w-60 bg-background p-4 border-r space-y-2 sticky top-16 h-[calc(100vh-4rem)]">
          <nav className="flex flex-col space-y-1">
            {desktopNavLinks}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-10 bg-secondary/50 overflow-y-auto h-[calc(100vh-4rem)]">
          <div className="container mx-auto">
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                    {userProfile && userProfile.role === "admin" && (
                        <Link href="/admin" passHref>
                            <Button variant="outline" size="sm" className="mt-4 sm:hidden">
                                <Shield className="mr-2 h-4 w-4" /> Admin Panel
                            </Button>
                        </Link>
                    )}
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

const ProtectedDashboardPage = () =>
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>;

export default ProtectedDashboardPage;
