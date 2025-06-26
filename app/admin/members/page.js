"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { db, app } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import AdminRoute from "@/components/auth/AdminRoute";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog"; // Added AlertDialog components
// Re-using AdminLayout by wrapping content.
// This assumes AdminLayout is structured to take children, which it is from previous step.
// However, for Next.js App Router, pages are typically self-contained or use a layout.js file.
// For simplicity here, we'll import the Layout directly if it's default exported from admin page,
// or re-create a similar structure if not.
// Let's assume we can't directly import AdminLayout from 'app/admin/page.js' due to it being a page.
// We'll define a local AdminLayout wrapper or expect one from a shared components folder.
// For now, to keep it simple, this page will render its content, and rely on a potential `app/admin/layout.js` for overall structure.
// If `app/admin/layout.js` is not created yet, this page might look unstyled initially without the admin navbar.
// Let's proceed by creating the content first. The layout can be applied via `app/admin/layout.js`.
// AdminRoute is removed from here as it's handled by app/admin/layout.js

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye } from "lucide-react"; // For view details button

const MembersListPageContent = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // For initial table load
  const [error, setError] = useState(null); // For initial table load error
  const [actionStates, setActionStates] = useState({}); // To track loading/message for individual rows

  // State for Delete User Dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null); // Stores { id: string, fullName: string }
  const [isDeleting, setIsDeleting] = useState(false); // For delete button loading state in dialog

  const functions = getFunctions(app);
  const approveUserFunction = httpsCallable(functions, 'approveUser');
  const deleteUserAccountFunction = httpsCallable(functions, 'deleteUserAccount');


  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const usersCollectionRef = collection(db, "users");
      const q = query(usersCollectionRef, orderBy("fullName", "asc"));
      const querySnapshot = await getDocs(q);
      const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    } catch (err) {
      console.error("Error fetching users:", err);
      // @ts-ignore
      setError(err.message || "Failed to fetch users.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApproveUser = async (userIdToApprove) => {
    setActionStates(prev => ({ ...prev, [userIdToApprove]: { isLoading: true, message: '', error: '' } }));
    try {
      // @ts-ignore
      const result = await approveUserFunction({ userIdToApprove });
      setActionStates(prev => ({ ...prev, [userIdToApprove]: { isLoading: false, message: result.data.message, error: '' } }));
      // Update user status locally for immediate UI update
      setUsers(prevUsers => prevUsers.map(u =>
        // @ts-ignore
        u.id === userIdToApprove ? { ...u, status: 'approved' } : u
      ));
      // Optionally clear message after a few seconds
      setTimeout(() => {
        setActionStates(prev => ({ ...prev, [userIdToApprove]: { ...prev[userIdToApprove], message: '' } }));
      }, 3000);
    } catch (err) {
      console.error("Error approving user (client):", err);
      // @ts-ignore
      setActionStates(prev => ({ ...prev, [userIdToApprove]: { isLoading: false, message: '', error: err.message || "Failed to approve." } }));
    }
  };

  const handleDeleteUserInitiate = (userId, userName) => {
    // @ts-ignore
    setUserToDelete({ id: userId, fullName: userName });
    setShowDeleteDialog(true);
    // Clear any previous general errors for this action from other rows
    setActionStates(prev => ({ ...prev, [userId]: { ...prev[userId], error: '' } }));
  };

  const handleDeleteUserConfirm = async () => {
    if (!userToDelete) return;

    // @ts-ignore
    const { id: userIdToDelete } = userToDelete;
    setIsDeleting(true);
    setActionStates(prev => ({ ...prev, [userIdToDelete]: { isLoading: true, message: '', error: '' } }));


    try {
      // @ts-ignore
      await deleteUserAccountFunction({ userIdToDelete });
      setActionStates(prev => ({
        ...prev,
        [userIdToDelete]: { isLoading: false, message: "User deleted successfully.", error: '' }
      }));
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userIdToDelete)); // Remove user from local list
      setShowDeleteDialog(false);
      setUserToDelete(null);
       // Optionally clear message after a few seconds
       setTimeout(() => {
        setActionStates(prev => ({ ...prev, [userIdToDelete]: { ...prev[userIdToDelete], message: '' } }));
      }, 3000);
    } catch (err) {
      console.error("Error deleting user (client):", err);
      // @ts-ignore
      setActionStates(prev => ({
        ...prev,
        // @ts-ignore
        [userIdToDelete]: { isLoading: false, message: '', error: err.message || "Failed to delete user." }
      }));
      // Keep dialog open on error to show error within dialog, or close and show general error
      // For now, let's keep it simple and let errors show next to the row after dialog closes.
      // Or, we could add specific error state for the dialog itself.
      // For now, if error occurs, it will show on the row after dialog closes.
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };


  if (isLoading && users.length === 0) { // Show main loading only if users haven't been loaded at all
    return <div className="flex items-center justify-center h-full"><p>Loading members...</p></div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-full"><p className="text-red-500">Error: {error}</p></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">IEDC Members</h1>
        {/* Optional: Add New Member button or other actions */}
      </div>

      {users.length === 0 ? (
        <p>No members found.</p>
      ) : (
        <div className="bg-card p-4 rounded-lg shadow overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Register No.</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead> {/* Added Status column */}
                <TableHead className="text-right">Actions</TableHead> {/* Align Actions to right */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                // @ts-ignore
                <TableRow key={user.id}>
                  {/* @ts-ignore */}
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  {/* @ts-ignore */}
                  <TableCell>{user.email}</TableCell>
                  {/* @ts-ignore */}
                  <TableCell>{user.registerNumber || 'N/A'}</TableCell>
                  {/* @ts-ignore */}
                  <TableCell>{user.department || 'N/A'}</TableCell>
                  {/* @ts-ignore */}
                  <TableCell>{user.year || 'N/A'}</TableCell>
                  {/* @ts-ignore */}
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-semibold
                        ${user.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                          user.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'}`}
                    >
                      {/* @ts-ignore */}
                      {user.status ? user.status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {/* @ts-ignore */}
                    {user.status === 'pending_approval' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                          // @ts-ignore
                          onClick={() => handleApproveUser(user.id)}
                          // @ts-ignore
                          disabled={actionStates[user.id]?.isLoading}
                        >
                          {/* @ts-ignore */}
                          {actionStates[user.id]?.isLoading ? 'Approving...' : 'Approve'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                          // @ts-ignore
                          onClick={() => handleDeleteUserInitiate(user.id, user.fullName)}
                          // @ts-ignore
                          disabled={actionStates[user.id]?.isLoading || actionStates[user.id]?.isDeleting}
                        >
                          {/* @ts-ignore */}
                          {actionStates[user.id]?.isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                      </>
                    ) : (
                      <Link href={`/admin/members/${user.id}`} passHref>
                        <Button variant="ghost" size="icon" aria-label="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    {/* @ts-ignore */}
                    {actionStates[user.id]?.message && <p className="text-xs text-green-500 ml-2">{actionStates[user.id]?.message}</p>}
                    {/* @ts-ignore */}
                    {actionStates[user.id]?.error && <p className="text-xs text-red-500 ml-2">{actionStates[user.id]?.error}</p>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete User Confirmation Dialog */}
      {userToDelete && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the account for
                {/* @ts-ignore */}
                <strong> {userToDelete.fullName} </strong>
                and remove all their associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {setShowDeleteDialog(false); setUserToDelete(null);}} disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUserConfirm}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-destructive-foreground"
              >
                {isDeleting ? "Deleting..." : "Yes, delete user"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};


// This is the main export for the page, wrapped in AdminRoute for protection.
// It will be nested within app/admin/layout.js if that file provides the AdminLayout shell.
const MembersPage = () => {
  return (
    // AdminRoute wrapper removed, protection is handled by app/admin/layout.js
    <MembersListPageContent />
  );
};

export default MembersPage;
