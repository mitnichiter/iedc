"use client";

import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { LayoutDashboard, Users, LogOut, ChevronLeft, UserCog } from "lucide-react"; // Added UserCog
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AdminRoute from "@/components/auth/AdminRoute";

// This is the AdminLayout component, moved from app/admin/page.js
const AdminPanelLayout = ({ children }) => {
  const { user } = useAuth(); // Get the authenticated user to check their role
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/"); // Redirect to homepage or login after logout
    } catch (error) {
      console.error("Admin logout failed:", error);
    }
  };

  return (
    <AdminRoute> {/* Ensure the entire layout and its children are admin protected */}
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-sm">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="text-lg font-bold flex items-center" aria-label="Back to User Dashboard">
                  <ChevronLeft className="h-5 w-5 mr-1" /> User Dashboard
              </Link>
              <span className="text-lg font-bold text-muted-foreground">/</span>
              <h1 className="text-lg font-bold">Admin Panel</h1>
            </div>
            <Button onClick={handleLogout} variant="ghost" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>

        <div className="flex flex-1">
          {/* Side Navbar */}
          <aside className="w-64 bg-background p-4 border-r space-y-2 sticky top-16 h-[calc(100vh-4rem)]">
            <nav className="flex flex-col space-y-1">
              <Link href="/admin" passHref>
                <Button variant="ghost" className="w-full justify-start">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Overview
                </Button>
              </Link>
              <Link href="/admin/members" passHref>
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Members
                </Button>
              </Link>
              {/* Link for granting admin role - visible to all admins */}
              <Link href="/admin/givesr" passHref>
                <Button variant="ghost" className="w-full justify-start text-orange-600 hover:text-orange-700">
                  <UserCog className="mr-2 h-4 w-4" />
                  Grant Admin (Setup)
                </Button>
              </Link>
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 p-6 md:p-10 bg-secondary/50 overflow-y-auto h-[calc(100vh-4rem)]">
            {children} {/* This is where the specific admin page content will go */}
          </main>
        </div>
      </div>
    </AdminRoute>
  );
};

export default AdminPanelLayout;
