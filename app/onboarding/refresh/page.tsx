"use client";

import { useState } from "react";
import { ArrowRight, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSession } from "next-auth/react";

export default function OnboardingRefresh() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();

  const handleRestartOnboarding = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/create-onboarding-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session?.user._id }),
      });

      const data = await response.json();

      if (data.status === "needs_onboarding" && data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Unable to Restart",
          description: "Please contact our support team for assistance.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error restarting onboarding:", error);
      toast({
        title: "Error",
        description: "An error occurred while restarting onboarding.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container relative min-h-screen items-center justify-center py-8 md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-purple-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          M4KTABA
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "Let's get you back on track to complete your onboarding process."
            </p>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">
                Onboarding Incomplete
              </CardTitle>
              <CardDescription>
                Let's help you complete your account setup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <RefreshCcw className="h-4 w-4" />
                <AlertTitle>Action Required</AlertTitle>
                <AlertDescription>
                  It looks like you didn't complete the onboarding process.
                  You'll need to complete this to access all features.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                onClick={handleRestartOnboarding}
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Continue Onboarding
              </Button>
              <p className="px-6 text-center text-sm text-muted-foreground">
                Having trouble?{" "}
                <a
                  href="/support"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Contact support
                </a>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
