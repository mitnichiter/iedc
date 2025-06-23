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
import { Shield, User, Library, Layers3, LogOut, CheckCircle, Edit } from "lucide-react"; // Added Edit
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select"; // Assuming this is the path
// --- Interest Options (copied from register page, ensure consistency or centralize) ---
const interestOptions = [
  { value: 'Photography', label: 'Photography' },
  { value: 'Videography', label: 'Videography' },
  { value: 'Web Development', label: 'Web Development' },
  { value: 'Web Designing', label: 'Web Designing' },
  { value: 'Graphic Designing', label: 'Graphic Designing' },
  { value: 'Content Creation', label: 'Content Creation' },
  { value: 'Video Editing', label: 'Video Editing' },
  { value: 'Photo Editing', label: 'Photo Editing' },
  { value: 'Robotics', label: 'Robotics' },
  { value: 'Cybersecurity', label: 'Cybersecurity' },
  { value: 'Other', label: 'Other' },
];


// This is the actual content component for the dashboard
const DashboardPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // To control edit mode/modal
  const [editData, setEditData] = useState({ // To hold form data for editing
    fullName: "",
    dob: "",
    phone: "",
    address: "",
    selectedInterests: [],
    otherInterest: "",
  });
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false); // For loading state of save button


  const handleProfileUpdate = async () => {
    if (!user || !userProfile) {
      setUpdateError("User not found. Please try again.");
      return;
    }

    setIsUpdatingProfile(true);
    setUpdateMessage("");
    setUpdateError("");

    // Prepare the final list of interests from editData
    let finalInterests = editData.selectedInterests.filter(interest => interest !== 'Other');
    if (editData.selectedInterests.includes('Other') && editData.otherInterest) {
      finalInterests.push(editData.otherInterest.trim());
    }
    finalInterests = [...new Set(finalInterests)].filter(i => i.trim() !== ""); // Deduplicate and remove empty

    const updatedData = {
      fullName: editData.fullName.trim(),
      dob: editData.dob,
      phone: editData.phone.trim(),
      address: editData.address.trim(),
      interests: finalInterests,
    };

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, updatedData);

      // Update local userProfile state to reflect changes immediately
      setUserProfile(prevProfile => ({
        ...prevProfile,
        ...updatedData
      }));

      setUpdateMessage("Profile updated successfully!");
      setTimeout(() => {
        setIsEditing(false); // Close dialog on success after a short delay
        setUpdateMessage(""); // Clear message
      }, 2000);

    } catch (error) {
      console.error("Error updating profile:", error);
      setUpdateError("Failed to update profile. Please try again.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Effect to initialize editData when userProfile is loaded
  useEffect(() => {
    if (userProfile) {
      setEditData({
        fullName: userProfile.fullName || "",
        dob: userProfile.dob || "",
        phone: userProfile.phone || "",
        address: userProfile.address || "",
        // Filter out 'Other' if it's present and store the custom value in otherInterest
        selectedInterests: userProfile.interests ? userProfile.interests.filter(interest => {
          if (interestOptions.find(opt => opt.value === interest)) {
            return true;
          }
          // If interest is not in predefined options, assume it's an "Other" value
          setEditData(prev => ({ ...prev, otherInterest: interest }));
          return false; // Don't include it in selectedInterests directly if it's custom
        }).concat(userProfile.interests.includes(interestOptions.find(opt => opt.value === 'Other')?.value) ? ['Other'] : []) : [],
        otherInterest: userProfile.interests && !userProfile.interests.some(i => interestOptions.map(o=>o.value).includes(i)) ? userProfile.interests.find(i => !interestOptions.map(o=>o.value).includes(i)) || "" : "",
      });
    }
  }, [userProfile]);


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
                  <CardTitle className="flex items-center justify-between text-primary">
                    <div className="flex items-center gap-2">
                      <User /> Your Profile
                    </div>
                    <Dialog open={isEditing} onOpenChange={setIsEditing}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => { setUpdateMessage(''); setUpdateError(''); /* Reset messages when opening */ }}>
                          <Edit className="mr-2 h-4 w-4" /> Edit Profile
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Edit Your Profile</DialogTitle>
                          <DialogDescription>
                            Make changes to your profile here. Click save when you're done.
                            Email, Register Number, Department, Year and Semester cannot be changed here.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-fullName" className="text-right">Full Name</Label>
                            <Input id="edit-fullName" value={editData.fullName} onChange={(e) => setEditData({...editData, fullName: e.target.value })} className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-dob" className="text-right">Date of Birth</Label>
                            <Input id="edit-dob" type="date" value={editData.dob} onChange={(e) => setEditData({...editData, dob: e.target.value })} className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-phone" className="text-right">Phone</Label>
                            <Input id="edit-phone" value={editData.phone} onChange={(e) => setEditData({...editData, phone: e.target.value })} className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-address" className="text-right">Address</Label>
                            <Input id="edit-address" value={editData.address} onChange={(e) => setEditData({...editData, address: e.target.value })} className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-interests" className="text-right">Interests</Label>
                            <MultiSelect
                              id="edit-interests"
                              options={interestOptions}
                              selected={editData.selectedInterests}
                              onChange={(selected) => setEditData({...editData, selectedInterests: selected})}
                              className="col-span-3"
                            />
                          </div>
                          {editData.selectedInterests.includes('Other') && (
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-otherInterest" className="text-right">Other Interest</Label>
                              <Input id="edit-otherInterest" value={editData.otherInterest} onChange={(e) => setEditData({...editData, otherInterest: e.target.value })} className="col-span-3" placeholder="Specify other interest" />
                            </div>
                          )}
                        </div>
                        {updateMessage && <p className="text-sm text-green-600">{updateMessage}</p>}
                        {updateError && <p className="text-sm text-red-600">{updateError}</p>}
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isUpdatingProfile}>Cancel</Button>
                          <Button type="button" onClick={handleProfileUpdate} disabled={isUpdatingProfile}>
                            {isUpdatingProfile ? "Saving..." : "Save Changes"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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

              {/* ✅ Interests Card (Now primarily for display, editing is in modal) */}
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
