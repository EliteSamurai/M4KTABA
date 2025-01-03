import Link from "next/link";
import { CreditCard, Settings, User } from "lucide-react";

import { useState } from "react";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false); // For toggling sidebar visibility on mobile

  return (
    <div>
      {/* Toggle Button for mobile */}
      <button className="md:hidden py-4" onClick={() => setIsOpen(!isOpen)}>
        {/* Hamburger Icon (you can use an icon library like Heroicons or create one) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`w-64 border-r bg-background pt-6 md:block ${
          isOpen ? "block w-full" : "hidden"
        } md:relative md:flex md:flex-col`}
      >
        <div className="flex h-14 items-center border-b px-4">
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
        <nav className="space-y-3 p-2">
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-lg bg-accent/50 px-3 py-2 text-accent-foreground"
          >
            <User className="h-5 w-5" />
            Profile
          </Link>
          <Link
            href="billing"
            className="flex items-center gap-3 rounded-lg bg-accent/50 px-3 py-2 text-accent-foreground"
          >
            <CreditCard className="h-5 w-5" />
            Billing
          </Link>
          <Link
            href="account"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
          >
            <Settings className="h-5 w-5" />
            Account
          </Link>
        </nav>
      </aside>
    </div>
  );
}
