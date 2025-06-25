// File: app/admin/page.js
"use client";

import AdminRoute from "@/components/auth/AdminRoute";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";

import { useEffect, useState } from "react";
import { db, app } from "@/lib/firebase"; // Import app for functions
import { collection, getDocs } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// This is the actual content of the admin page
const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({}); // For individual button loading

  const functions = getFunctions(app);
  const approveUserCallable = httpsCallable(functions, 'approveUser');
  const deleteUserCallable = httpsCallable(functions, 'deleteUser');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      alert("Failed to fetch users: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: 'approving' }));
    try {
      await approveUserCallable({ userId });
      // Update UI: Set user as approved
      setUsers(prevUsers => prevUsers.map(u =>
        u.id === userId ? { ...u, is_approved: true } : u
      ));
      alert("User approved successfully!");
    } catch (error) {
      console.error("Error approving user:", error);
      alert(`Failed to approve user: ${error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: undefined }));
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }
    setActionLoading(prev => ({ ...prev, [userId]: 'deleting' }));
    try {
      await deleteUserCallable({ userId });
      // Update UI: Remove user from list
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      alert("User deleted successfully!");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(`Failed to delete user: ${error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: undefined }));
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Admin Control Center</h1>
      <p className="mt-2 text-muted-foreground">Welcome, Admin {user?.email}!</p>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold">User Management</h2>
        {loading ? (
          <p>Loading users...</p>
        ) : users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.fullName}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.department}</TableCell>
                  <TableCell>{u.year}</TableCell>
                  <TableCell>{u.semester}</TableCell>
                  <TableCell>
                    {u.is_approved ? (
                      <span className="text-green-600 font-semibold">Approved</span>
                    ) : (
                      <span className="text-yellow-600 font-semibold">Pending</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {!u.is_approved && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2"
                          onClick={() => handleApprove(u.id)}
                          disabled={actionLoading[u.id] === 'approving' || actionLoading[u.id] === 'deleting'}
                        >
                          {actionLoading[u.id] === 'approving' ? 'Approving...' : 'Approve'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(u.id)}
                          disabled={actionLoading[u.id] === 'approving' || actionLoading[u.id] === 'deleting'}
                        >
                           {actionLoading[u.id] === 'deleting' ? 'Deleting...' : 'Delete'}
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <hr className="my-4" />
        <h2 className="text-xl font-semibold">Event Management</h2>
        <p className="text-sm text-muted-foreground">[Create new event form will go here]</p>
      </div>
    </div>
  );
};

// We wrap the content component with our new AdminRoute guard
const AdminPage = () => {
  return (
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  );
};

export default AdminPage;