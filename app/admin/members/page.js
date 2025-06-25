"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import AdminRoute from "@/components/auth/AdminRoute";
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const usersCollectionRef = collection(db, "users");
        // Optional: Order users by a field, e.g., fullName
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

    fetchUsers();
  }, []);

  if (isLoading) {
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
        <div className="bg-card p-4 rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Register No.</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                // @ts-ignore
                <TableRow key={user.id}>
                  {/* @ts-ignore */}
                  <TableCell>{user.fullName}</TableCell>
                  {/* @ts-ignore */}
                  <TableCell>{user.email}</TableCell>
                  {/* @ts-ignore */}
                  <TableCell>{user.registerNumber || 'N/A'}</TableCell>
                  {/* @ts-ignore */}
                  <TableCell>{user.department || 'N/A'}</TableCell>
                  {/* @ts-ignore */}
                  <TableCell>{user.year || 'N/A'}</TableCell>
                  <TableCell>
                    <Link href={`/admin/members/${user.id}`} passHref>
                      <Button variant="ghost" size="icon" aria-label="View Details">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
