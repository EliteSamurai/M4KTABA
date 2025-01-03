"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";

export default function AccountPage() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    "current-password": "",
    "new-password": "",
    "confirm-password": "",
  });
  const [inputUserId, setInputUserId] = useState("");

  const userId = session?.user._id;

  const [alert, setAlert] = useState({ message: "", type: "" });
  const [isDialogOpen, setDialogOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [id]: value,
    }));
  };

  const handleDialogDismiss = () => {
    setDialogOpen(false);
    if (alert.type === "success") {
      signOut();
    }
  };

  const handleDeleteAccount = async () => {
    if (inputUserId !== userId) {
      setAlert({ type: "error", message: "The user ID entered is incorrect." });
      setDialogOpen(true);
      return;
    }

    try {
      const response = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        setAlert({ type: "error", message: error.message });
        setDialogOpen(true);
        return;
      }

      setAlert({ type: "success", message: "Your account has been deleted." });
      setDialogOpen(true);
    } catch (error) {
      setAlert({ type: "error", message: "An unexpected error occurred." });
      setDialogOpen(true);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...formData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update password");
      }

      setAlert({ message: "Password updated successfully!", type: "success" });
      setFormData({
        "current-password": "",
        "new-password": "",
        "confirm-password": "",
      });
    } catch (error: any) {
      setAlert({ message: error.message, type: "error" });
    } finally {
      setDialogOpen(true);
    }
  };

  return (
    <div className="flex bg-gray-50/50 min-h-screen">
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <h1 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">
          Account Settings
        </h1>
        <div className="grid gap-4 md:gap-6 md:grid-cols-2">
          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">
                Change Password
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  value={formData["current-password"]}
                  onChange={handleInputChange}
                  id="current-password"
                  type="password"
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  onChange={handleInputChange}
                  value={formData["new-password"]}
                  id="new-password"
                  type="password"
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  onChange={handleInputChange}
                  value={formData["confirm-password"]}
                  id="confirm-password"
                  type="password"
                  className="w-full"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleSubmit}>
                Update Password
              </Button>
            </CardFooter>
          </Card>

          {/* Delete Account Card */}
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">
                Delete Account
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all data.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <p className="text-sm text-muted-foreground">
                Once you delete your account, there is no going back. Please be
                certain.
              </p>
              <p className="text-sm">
                Your User ID: <strong>{userId}</strong>
              </p>
              <input
                type="text"
                placeholder="Enter your User ID to confirm"
                value={inputUserId}
                onChange={(e) => setInputUserId(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
              />
            </CardContent>
            <CardFooter>
              <button
                onClick={handleDeleteAccount}
                className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
              >
                Delete Account
              </button>
            </CardFooter>
          </Card>
        </div>

        {/* Alert Dialog */}
        <AlertDialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {alert.type === "success" ? "Success" : "Error"}
              </AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>{alert.message}</AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogAction onClick={handleDialogDismiss}>
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
