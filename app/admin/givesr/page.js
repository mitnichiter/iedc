"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app, auth } from "@/lib/firebase"; // auth is for getting current user's UID easily
import { useAuth } from "@/lib/AuthContext"; // To get current user easily for pre-filling

const GrantAdminRolePageContent = () => {
  const { user: currentUser } = useAuth(); // Get the currently logged-in user
  const [targetUid, setTargetUid] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const functions = getFunctions(app);
  const grantAdminRoleFunction = httpsCallable(functions, 'grantAdminRole');

  // Pre-fill targetUid if current user is available (useful if admin wants to make themselves admin)
  useState(() => {
    if (currentUser) {
      setTargetUid(currentUser.uid);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleGrantAdminRole = async () => {
    if (!targetUid) {
      setError("Please enter the User ID (UID) of the user to make admin.");
      return;
    }
    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      const result = await grantAdminRoleFunction({ uid: targetUid });
      // @ts-ignore
      setMessage(result.data.message);
      setTargetUid(""); // Clear input on success
    } catch (err) {
      console.error("Error calling grantAdminRole function:", err);
      // @ts-ignore
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Grant Admin Role</CardTitle>
          <CardDescription>
            Enter the User ID (UID) of the user you want to grant administrator privileges to.
            This will set their custom claim `role` to `&apos;admin&apos;` and update their Firestore document.
            The user will need to log out and log back in for the new role to take full effect in their session token.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetUid">User ID (UID)</Label>
            <Input
              id="targetUid"
              placeholder="Enter User ID"
              value={targetUid}
              onChange={(e) => setTargetUid(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              You can find the UID in the Firebase Authentication console.
              {currentUser && ` Your current UID is: ${currentUser.uid}`}
            </p>
          </div>
          <Button onClick={handleGrantAdminRole} disabled={isLoading}>
            {isLoading ? "Granting Role..." : "Grant Admin Role"}
          </Button>
          {message && <p className="text-sm text-green-500">{message}</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
};

// This page will be wrapped by app/admin/layout.js, which includes AdminRoute
const GrantAdminRolePage = () => {
  return <GrantAdminRolePageContent />;
};

export default GrantAdminRolePage;
