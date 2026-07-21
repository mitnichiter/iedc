"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ArrowLeft, User, Phone, MapPin, CalendarDays, GraduationCap, Star, ClipboardCopy, Settings2, Trash2, UserCog } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId;

  const [userDetail, setUserDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showChangeRoleDialog, setShowChangeRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) throw error;
        setUserDetail(data);
        setSelectedRole(data.role || 'student');
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("User not found or error loading.");
      } finally {
        setIsLoading(false);
      }
    };
    if (userId) fetchUser();
  }, [userId]);

  const handleCopyUid = () => {
    navigator.clipboard.writeText(userId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRoleChange = async () => {
    setIsUpdatingRole(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUserDetail(prev => ({ ...prev, role: selectedRole }));
      setShowChangeRoleDialog(false);
    } catch (err) {
      alert("Failed to update role: " + err.message);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleDeleteUser = async () => {
    setIsDeletingUser(true);
    try {
      const response = await fetch(`/api/admin/users/delete?userId=${userId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error("Delete failed");
      
      router.push('/admin/members');
    } catch (err) {
      alert("Failed to delete user: " + err.message);
    } finally {
      setIsDeletingUser(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!userDetail) return <div>User not found</div>;

  return (
    <div>
      <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Members List
      </Button>

      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/50 p-6">
          <div className="flex justify-between items-start">
            <div className="flex gap-4">
              <div className="bg-primary text-primary-foreground rounded-full p-3 h-12 w-12 flex items-center justify-center">
                <User className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">{userDetail.full_name}</CardTitle>
                <CardDescription>
                   {userDetail.email} • Role: <span className="font-semibold capitalize">{userDetail.role}</span>
                </CardDescription>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                   UID: {userId} <Button variant="ghost" size="icon" className="h-4 w-4" onClick={handleCopyUid}><ClipboardCopy className="h-3 w-3"/></Button>
                   {copied && <span className="text-green-500">Copied</span>}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><Settings2 className="h-5 w-5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowChangeRoleDialog(true)}>
                  <UserCog className="mr-2 h-4 w-4" /> Change Role
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDeleteUserDialog(true)} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Member
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                <div>
                   <h4 className="font-semibold mb-2 text-primary">Academic Info</h4>
                   <p><GraduationCap className="inline mr-2 h-4 w-4 text-muted-foreground"/> Dept: {userDetail.department || 'N/A'}</p>
                   <p><CalendarDays className="inline mr-2 h-4 w-4 text-muted-foreground"/> Year: {userDetail.year || 'N/A'}</p>
                   <p>Register No: {userDetail.register_number || 'N/A'}</p>
                </div>
                <div>
                   <h4 className="font-semibold mb-2 text-primary">Personal Info</h4>
                   <p><Phone className="inline mr-2 h-4 w-4 text-muted-foreground"/> Phone: {userDetail.phone || 'N/A'}</p>
                   <p><CalendarDays className="inline mr-2 h-4 w-4 text-muted-foreground"/> DOB: {userDetail.dob || 'N/A'}</p>
                </div>
            </div>
            <div>
                <h4 className="font-semibold mb-2 text-primary">Interests</h4>
                <div className="flex flex-wrap gap-2">
                    {userDetail.interests?.map(i => (
                        <span key={i} className="px-2 py-1 bg-secondary rounded-full text-xs">{i}</span>
                    )) || "None"}
                </div>
            </div>
        </CardContent>
      </Card>

      {/* Role Dialog */}
      <Dialog open={showChangeRoleDialog} onOpenChange={setShowChangeRoleDialog}>
        <DialogContent>
            <DialogHeader><DialogTitle>Change Role</DialogTitle></DialogHeader>
            <div className="py-4">
                <Label>Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowChangeRoleDialog(false)}>Cancel</Button>
                <Button onClick={handleRoleChange} disabled={isUpdatingRole}>Update</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Delete User?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently remove {userDetail.full_name}.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
