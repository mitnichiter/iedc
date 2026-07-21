"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function LoginModal({ isOpen, onOpenChange }) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle>Login Required</DialogTitle>
          <DialogDescription>
             Please log in to your account to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-4">
             <Link href="/register/login" passHref>
                <Button className="w-full">Go to Login Page</Button>
             </Link>
             <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
