"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import getInitial from "@/utils/initials";
import { useCart } from "@/contexts/CartContext";
import { urlFor } from "@/utils/imageUrlBuilder";

const LoginButton = () => {
  const { data: session, status } = useSession();
  const { handleLogout } = useCart();

  if (status === "loading") {
    return (
      <Button size="sm" variant="ghost" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {session ? (
          <Avatar className="h-8 w-8 cursor-pointer transition-brightness brightness-75 hover:brightness-50 border">
            {session.user.image ? (
              <AvatarImage
                className="object-cover"
                src={urlFor(session.user.image)}
                alt={session.user.username || "User Avatar"}
              />
            ) : (
              <AvatarFallback className="bg-muted text-xs font-medium uppercase">
                {getInitial(
                  session.user.username || session.user.email.split("@")[0]
                )}
              </AvatarFallback>
            )}
          </Avatar>
        ) : (
          <Link href="/login">
            <button
              className="p-2 md:p-1.5 bg-slate-200 rounded-md text-xs md:text-base hover:text-white hover:bg-black"
            >
              Login
            </button>
          </Link>
        )}
      </DropdownMenuTrigger>

      {session && (
        <DropdownMenuContent
          align="end"
          className="w-[calc(100vw-2rem)] max-w-[16rem] p-2 rounded-md bg-white shadow-md sm:w-48"
        >
          <DropdownMenuLabel className="text-sm font-semibold">
            My Account
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/billing">Billing</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account">Account</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 dark:text-red-400"
            onClick={handleLogout}
          >
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
};

export default LoginButton;
