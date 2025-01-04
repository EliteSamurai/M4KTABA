import Link from "next/link";
import LoginButton from "@/components/LoginButton";
import { Button } from "./ui/button";
import { CartSheet } from "./CartSheet";
import { cn } from "@/lib/utils";
import { MobileNav } from "./mobile-nav";

const Links = [
  { href: "/all", text: "All Books" },
  { href: "/honey", text: "Honey" },
  { href: "/blog", text: "Blog" },
];

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="flex h-14 items-center justify-between px-4">
        {/* Mobile Navigation */}
        <div className="flex items-center md:hidden">
          <MobileNav links={Links} />
        </div>

        {/* Logo */}
          <Link
            href="/"
            className="text-xl font-bold tracking-tighter transition-colors hover:text-foreground/80 lg:text-2xl"
          >
            M4KTABA
          </Link>

        {/* Desktop Links */}
        <ul className="hidden md:flex items-center gap-6">
          {Links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground/80",
                  "relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0",
                  "after:bg-foreground after:transition-all after:duration-300 hover:after:w-full"
                )}
              >
                {link.text}
              </Link>
            </li>
          ))}
        </ul>

        {/* Action Buttons */}
        <div className="flex items-center sm:gap-4 gap-1">
          <LoginButton />
          <div className="hidden md:block">
            <Link href="/sell">
              <Button
                className="bg-purple-600 text-white hover:bg-purple-700"
                size="sm"
              >
                Sell
              </Button>
            </Link>
          </div>
          <CartSheet />
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
