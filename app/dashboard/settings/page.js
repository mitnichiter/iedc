"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signOut, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth"; // Added EmailAuthProvider, reauthenticateWithCredential, updatePassword
import { doc, getDoc, updateDoc } from "firebase/firestore";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { MultiSelect } from "@/components/ui/multi-select";
import { Edit, LogOut, User, Settings as SettingsIcon, ChevronLeft, Sun, Moon, Laptop } from "lucide-react"; // Added Sun, Moon, Laptop
import Link from 'next/link';
import { useTheme } from "next-themes"; // Import useTheme

// --- Interest Options (ensure this is consistent or centralized if used elsewhere) ---
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

const SettingsPageContent = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // States for Edit Profile Dialog (will be moved here in the next step)
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    fullName: "",
    dob: "",
    phone: "",
    address: "",
    selectedInterests: [],
    otherInterest: "",
  });
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const { theme, setTheme } = useTheme();

  // States for Password Change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChangeMessage, setPasswordChangeMessage] = useState("");
  const [passwordChangeError, setPasswordChangeError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);


  const handleChangePassword = async () => {
    setPasswordChangeMessage("");
    setPasswordChangeError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordChangeError("All password fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordChangeError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) { // Basic length check, Firebase might have stricter rules
        setPasswordChangeError("New password must be at least 6 characters long.");
        return;
    }

    setIsChangingPassword(true);
    const currentUser = auth.currentUser;

    if (currentUser && currentUser.email) { // Ensure email is not null
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      try {
        await reauthenticateWithCredential(currentUser, credential);
        // User re-authenticated, now change password
        await updatePassword(currentUser, newPassword);
        setPasswordChangeMessage("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch (error) {
        console.error("Password Change Error:", error);
        // @ts-ignore
        if (error.code === 'auth/wrong-password') {
          setPasswordChangeError("Incorrect current password.");
        // @ts-ignore
        } else if (error.code === 'auth/too-many-requests') {
          setPasswordChangeError("Too many attempts. Please try again later.");
        } else {
        // @ts-ignore
          setPasswordChangeError(error.message || "Failed to change password. Please try again.");
        }
      } finally {
        setIsChangingPassword(false);
      }
    } else {
      setPasswordChangeError("User not found or email is missing. Please re-login."); // Should not happen if user is on settings page
      setIsChangingPassword(false);
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
          // Initialize editData here once userProfile is fetched (logic will be fully moved in next step)
          const profileData = docSnap.data();
          setEditData({
            fullName: profileData.fullName || "",
            dob: profileData.dob || "",
            phone: profileData.phone || "",
            address: profileData.address || "",
            selectedInterests: profileData.interests ? profileData.interests.filter(interest => {
              if (interestOptions.find(opt => opt.value === interest)) return true;
              setEditData(prev => ({ ...prev, otherInterest: interest })); // Temporary
              return false;
            }).concat(profileData.interests.includes(interestOptions.find(opt => opt.value === 'Other')?.value) ? ['Other'] : []) : [],
            otherInterest: profileData.interests && !profileData.interests.some(i => interestOptions.map(o=>o.value).includes(i)) ? profileData.interests.find(i => !interestOptions.map(o=>o.value).includes(i)) || "" : "",
          });
        } else {
          console.error("No profile document found for this user!");
        }
        setIsLoading(false);
      }
    };
    fetchUserProfile();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

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
      // This will also update the display fields on the settings page
      setUserProfile(prevProfile => ({
        ...prevProfile,
        ...updatedData
      }));
      // Also update editData to ensure consistency if the dialog stays open or is reopened quickly
      setEditData(prevEditData => ({
        ...prevEditData,
        ...updatedData,
        selectedInterests: finalInterests.includes('Other') ? finalInterests.filter(i => i !== editData.otherInterest.trim()) : finalInterests, //
        // Repopulate selectedInterests carefully, keeping 'Other' selection if custom text was part of it
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


  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-background">Loading Settings...</div>;
  }

  if (!userProfile) {
    return <div className="flex items-center justify-center h-screen bg-background">Could not load user data.</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary/50">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-lg font-bold flex items-center">
              <ChevronLeft className="h-5 w-5 mr-1" /> Dashboard
            </Link>
            <span className="text-lg font-bold text-muted-foreground">/</span>
            <h1 className="text-lg font-bold">Settings</h1>
          </div>
          <Button onClick={handleLogout} variant="destructive" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8">
        <div className="container mx-auto">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Account Settings</h2>

            {/* Profile Information Section */}
            <div className="p-6 bg-card rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-medium">Personal Information</h3>
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => { setUpdateMessage(''); setUpdateError(''); }}>
                      <Edit className="mr-2 h-4 w-4" /> Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Edit Your Profile</DialogTitle>
                      <DialogDescription>
                        Make changes to your profile here. Click save when you&apos;re done.
                        Email, Register Number, Department, Year and Semester cannot be changed here.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      {/* Form fields will be fully populated from editData in the next step */}
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="settings-fullName" className="text-right">Full Name</Label>
                        <Input id="settings-fullName" value={editData.fullName} onChange={(e) => setEditData({...editData, fullName: e.target.value })} className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="settings-dob" className="text-right">Date of Birth</Label>
                        <Input id="settings-dob" type="date" value={editData.dob} onChange={(e) => setEditData({...editData, dob: e.target.value })} className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="settings-phone" className="text-right">Phone</Label>
                        <Input id="settings-phone" value={editData.phone} onChange={(e) => setEditData({...editData, phone: e.target.value })} className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="settings-address" className="text-right">Address</Label>
                        <Input id="settings-address" value={editData.address} onChange={(e) => setEditData({...editData, address: e.target.value })} className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="settings-interests" className="text-right">Interests</Label>
                        <MultiSelect
                          id="settings-interests"
                          options={interestOptions}
                          selected={editData.selectedInterests}
                          onChange={(selected) => setEditData({...editData, selectedInterests: selected})}
                          className="col-span-3"
                        />
                      </div>
                      {editData.selectedInterests.includes('Other') && (
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="settings-otherInterest" className="text-right">Other Interest</Label>
                          <Input id="settings-otherInterest" value={editData.otherInterest} onChange={(e) => setEditData({...editData, otherInterest: e.target.value })} className="col-span-3" placeholder="Specify other interest" />
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
              </div>
              <div className="space-y-3 text-sm">
                <p><strong>Full Name:</strong> {userProfile.fullName}</p>
                <p><strong>Email:</strong> {userProfile.email}</p>
                <p><strong>Phone:</strong> {userProfile.phone || 'Not set'}</p>
                <p><strong>Date of Birth:</strong> {userProfile.dob || 'Not set'}</p>
                <p><strong>Address:</strong> {userProfile.address || 'Not set'}</p>
                <div>
                  <strong>Interests:</strong>
                  {userProfile.interests && userProfile.interests.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {userProfile.interests.map(interest => <span key={interest} className="px-2 py-1 bg-secondary rounded text-xs">{interest}</span>)}
                    </div>
                  ) : (
                    <span> Not set</span>
                  )}
                </div>
              </div>
            </div>

            {/* Security Section - Password Change */}
            <div className="p-6 bg-card rounded-lg shadow">
              <h3 className="text-xl font-medium mb-4">Security</h3>
              <div className="space-y-4 max-w-md"> {/* Added max-w-md for better form appearance */}
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                <Button type="button" onClick={handleChangePassword} disabled={isChangingPassword}>
                  {isChangingPassword ? "Changing..." : "Change Password"}
                </Button>
                {passwordChangeMessage && <p className="text-sm text-green-600">{passwordChangeMessage}</p>}
                {passwordChangeError && <p className="text-sm text-red-600">{passwordChangeError}</p>}
              </div>
            </div>

            {/* Theme Settings Section */}
            <div className="p-6 bg-card rounded-lg shadow">
              <h3 className="text-xl font-medium mb-4">Theme Settings</h3>
              <div className="space-y-2">
                <Label>Appearance</Label>
                <div className="flex items-center space-x-2">
                  <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')} size="sm" className="flex-1">
                    <Sun className="mr-2 h-4 w-4" /> Light
                  </Button>
                  <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')} size="sm" className="flex-1">
                    <Moon className="mr-2 h-4 w-4" /> Dark
                  </Button>
                  <Button variant={theme === 'system' ? 'default' : 'outline'} onClick={() => setTheme('system')} size="sm" className="flex-1">
                    <Laptop className="mr-2 h-4 w-4" /> System
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Current theme: {theme ? theme.charAt(0).toUpperCase() + theme.slice(1) : 'System'}
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

const ProtectedSettingsPage = () => (
  <ProtectedRoute>
    <SettingsPageContent />
  </ProtectedRoute>
);

export default ProtectedSettingsPage;
