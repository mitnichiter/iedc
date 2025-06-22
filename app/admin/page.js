// File: app/admin/page.js
"use client";

import AdminRoute from "@/components/auth/AdminRoute";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";

// This is the actual content of the admin page
const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Admin Control Center</h1>
      <p className="mt-2 text-muted-foreground">Welcome, Admin {user?.email}!</p>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold">User Management</h2>
        <p className="text-sm text-muted-foreground">[User table will go here]</p>
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