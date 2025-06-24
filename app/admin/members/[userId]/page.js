"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
// AdminRoute removed, handled by layout
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  ArrowLeft, User, Mail, Hash, Briefcase, CalendarDays, GraduationCap, Star, MapPin, Phone, Settings2, Trash2, UserCog, ClipboardCopy
} from "lucide-react"; // Added ClipboardCopy
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"; // For Change Role Dialog
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog"; // For Delete Confirmation
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // For Role Select
import { Label } from "@/components/ui/label"; // For Dialog
import { getFunctions, httpsCallable } from "firebase/functions"; // For calling functions
import { app } from "@/lib/firebase"; // Firebase app instance for functions
import Link from "next/link";


const UserDetailPageContent = () => {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId; // This is the ID of the user being viewed
  const { user: loggedInAdmin } = useAuth(); // This is the currently logged-in admin

  const [userDetail, setUserDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for Change Role Dialog
  const [showChangeRoleDialog, setShowChangeRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [roleUpdateMessage, setRoleUpdateMessage] = useState("");
  const [roleUpdateError, setRoleUpdateError] = useState("");

  // State for Delete User Dialog
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [deleteUserMessage, setDeleteUserMessage] = useState("");
  const [deleteUserError, setDeleteUserError] = useState("");

  const [copied, setCopied] = useState(false); // For copy UID button feedback

  const functions = getFunctions(app);

  // Check if the logged-in admin is a superadmin
  // @ts-ignore
  const isSuperAdmin = loggedInAdmin && loggedInAdmin.customClaims && loggedInAdmin.customClaims.role === 'superadmin';

  useEffect(() => {
    if (userDetail) {
      // @ts-ignore
      setSelectedRole(userDetail.role);
    }
  }, [userDetail]);

  const handleCopyUid = () => {
    // @ts-ignore
    navigator.clipboard.writeText(userId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    }).catch(err => {
      console.error('Failed to copy UID: ', err);
      // Optionally show an error message to the user
    });
  };

  const handleRoleChange = async () => {
    if (!selectedRole) {
      setRoleUpdateError("Please select a role.");
      return;
    }
    setIsUpdatingRole(true);
    setRoleUpdateMessage("");
    setRoleUpdateError("");

    try {
      const setUserRoleFunction = httpsCallable(functions, 'setUserRole');
      // @ts-ignore
      await setUserRoleFunction({ userIdToUpdate: userId, newRole: selectedRole });
      setRoleUpdateMessage("User role updated successfully!");

      // Update local state to reflect change immediately
      // @ts-ignore
      setUserDetail(prev => ({ ...prev, role: selectedRole }));

      setTimeout(() => {
        setShowChangeRoleDialog(false);
        setRoleUpdateMessage("");
      }, 2000);

    } catch (err) {
      console.error("Error updating role:", err);
      // @ts-ignore
      setRoleUpdateError(err.message || "Failed to update role.");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleDeleteUser = async () => {
    setIsDeletingUser(true);
    setDeleteUserMessage(""); // Clear previous general messages
    setDeleteUserError("");

    try {
      const deleteUserFunction = httpsCallable(functions, 'deleteUserAccount');
      // @ts-ignore
      await deleteUserFunction({ userIdToDelete: userId });
      // No need to set success message here as we will redirect
      // For a brief moment a success toast could be shown if desired, but router.push is quick
      router.push('/admin/members?deleted=true'); // Redirect to members list with a query param
    } catch (err) {
      console.error("Error deleting user:", err);
      // @ts-ignore
      setDeleteUserError(err.message || "Failed to delete user.");
      setShowDeleteUserDialog(false); // Close dialog on error to show general error message
    } finally {
      setIsDeletingUser(false);
    }
  };

  useEffect(() => {
    const fetchUserDetail = async () => {
      if (!userId) {
        setError("User ID is missing.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        // @ts-ignore
        const userDocRef = doc(db, "users", userId);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setUserDetail(docSnap.data());
        } else {
          setError("User not found.");
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
        // @ts-ignore
        setError(err.message || "Failed to fetch user details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetail();
  }, [userId]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><p>Loading user details...</p></div>;
  }

  if (error) {
    return (
      <div className="text-center">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  if (!userDetail) {
    return (
      <div className="text-center">
        <p className="mb-4">No user details found.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  // @ts-ignore
  const { fullName, email, registerNumber, department, year, semester, dob, phone, address, interests, role } = userDetail;

  return (
    <div>
      <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Members List
      </Button>

      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/50 p-6">
          <div className="flex items-start justify-between"> {/* Changed to justify-between */}
            <div className="flex items-start gap-4"> {/* Original user info grouping */}
              <div className="bg-primary text-primary-foreground rounded-full p-3 flex items-center justify-center">
                <User className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl">{fullName}</CardTitle>
                {/* @ts-ignore */}
                <CardDescription className="text-sm text-muted-foreground">{email} - Role: <span className="font-semibold capitalize">{role}</span></CardDescription>
                {isSuperAdmin && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">UID: {userId}</span>
                    <Button variant="ghost" size="sm" onClick={handleCopyUid} className="h-auto p-0.5 hover:bg-muted">
                      <ClipboardCopy className="h-3 w-3" />
                    </Button>
                    {copied && <span className="text-xs text-green-500">Copied!</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Admin Actions Dropdown - Only for Superadmins */}
            {isSuperAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="User Actions">
                    <Settings2 className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { setRoleUpdateError(""); setRoleUpdateMessage(""); if(userDetail) {setSelectedRole(userDetail.role)}; setShowChangeRoleDialog(true); }}>
                    <UserCog className="mr-2 h-4 w-4" />
                    Change Role
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 hover:!text-red-600 hover:!bg-red-50 focus:!text-red-600 focus:!bg-red-50"
                    onClick={() => { setDeleteUserError(""); setShowDeleteUserDialog(true); }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Member
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2 text-primary">Academic Information</h4>
              <div className="space-y-1">
                <p><GraduationCap className="inline mr-2 h-4 w-4 text-muted-foreground" /><strong>Department:</strong> {department || 'N/A'}</p>
                <p><CalendarDays className="inline mr-2 h-4 w-4 text-muted-foreground" /><strong>Year:</strong> {year || 'N/A'}</p>
                <p><CalendarDays className="inline mr-2 h-4 w-4 text-muted-foreground" /><strong>Semester:</strong> {semester || 'N/A'}</p>
                <p><Hash className="inline mr-2 h-4 w-4 text-muted-foreground" /><strong>Register No:</strong> {registerNumber || 'N/A'}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-primary">Personal Details</h4>
              <div className="space-y-1">
                <p><CalendarDays className="inline mr-2 h-4 w-4 text-muted-foreground" /><strong>Date of Birth:</strong> {dob || 'N/A'}</p>
                <p><Phone className="inline mr-2 h-4 w-4 text-muted-foreground" /><strong>Phone:</strong> {phone || 'N/A'}</p>
                <p><MapPin className="inline mr-2 h-4 w-4 text-muted-foreground" /><strong>Address:</strong> {address || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2 text-primary flex items-center"><Star className="inline mr-2 h-4 w-4 text-muted-foreground" />Interests</h4>
            {interests && interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {/* @ts-ignore */}
                {interests.map((interest) => (
                  <span key={interest} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs">
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No interests specified.</p>
            )}
          </div>

          {/* Placeholder for other sections like event participation, etc. */}
        </CardContent>
      </Card>

      {/* Change Role Dialog */}
      <Dialog open={showChangeRoleDialog} onOpenChange={setShowChangeRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            {/* @ts-ignore */}
            <DialogDescription>Select the new role for {userDetail?.fullName}.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="role-select">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role-select">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  {/* Add other roles if they exist */}
                </SelectContent>
              </Select>
            </div>
            {roleUpdateMessage && <p className="text-sm text-green-500">{roleUpdateMessage}</p>}
            {roleUpdateError && <p className="text-sm text-red-500">{roleUpdateError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangeRoleDialog(false)} disabled={isUpdatingRole}>Cancel</Button>
            <Button onClick={handleRoleChange} disabled={isUpdatingRole}>
              {isUpdatingRole ? "Updating Role..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the account for
              {/* @ts-ignore */}
              <strong> {userDetail?.fullName} </strong>
              and remove all their associated data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteUserDialog(false)} disabled={isDeletingUser}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeletingUser}
              className="bg-red-600 hover:bg-red-700 text-destructive-foreground"
            >
              {isDeletingUser ? "Deleting..." : "Yes, delete user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Display general delete errors not shown in dialog, e.g. if dialog closes before error appears */}
      {deleteUserError && <p className="mt-4 text-sm text-red-500 text-center">{deleteUserError}</p>}
    </div>
  );
};

// This is the main export for the page, wrapped in AdminRoute for protection.
// It will be nested within app/admin/layout.js for the overall Admin Panel shell.
const UserDetailsPage = () => {
  return (
    // AdminRoute wrapper removed, protection is handled by app/admin/layout.js
    <UserDetailPageContent />
  );
};

export default UserDetailsPage;
