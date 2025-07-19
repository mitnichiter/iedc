// File: app/admin/page.js
"use client";

// AdminRoute is now handled by app/admin/layout.js
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
// Icons like LayoutDashboard, Users, LogOut, ChevronLeft are now in layout.js
// useRouter, signOut, auth for logout are now in layout.js


// This is the content for the main admin dashboard page (/admin)
const AdminDashboardContent = () => {
  const { user } = useAuth(); // Still need useAuth for user-specific content like email
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Overview</h1>
      <p className="text-muted-foreground mb-6">Welcome, Admin {user?.email}!</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-card rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">User Management</h2>
          <p className="text-sm text-muted-foreground">View and manage IEDC members.</p>
          <Link href="/admin/members" passHref>
            <Button variant="outline" className="mt-4">Go to Members List</Button>
          </Link>
        </div>
        <div className="p-6 bg-card rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Event Management</h2>
          <p className="text-sm text-muted-foreground">Create, edit, and manage events.</p>
          {/* Placeholder for event management link/button */}
          <Button variant="outline" className="mt-4" disabled>Manage Events (Coming Soon)</Button>
        </div>
      </div>
    </div>
  );
};

// The AdminPage now directly exports the content.
// AdminRoute and AdminLayout are applied by app/admin/layout.js
const AdminPage = () => {
  return (
    <AdminDashboardContent />
  );
};

export default AdminPage;