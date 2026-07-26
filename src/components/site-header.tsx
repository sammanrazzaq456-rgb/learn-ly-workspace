import { Link } from "@tanstack/react-router";
import { GraduationCap, Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-display text-lg font-bold tracking-tight">Lumen</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="/#features" className="transition-colors hover:text-foreground">
            Features
          </a>
          <a href="/#how-it-works" className="transition-colors hover:text-foreground">
            How it works
          </a>
          <a href="/#faq" className="transition-colors hover:text-foreground">
            FAQ
          </a>
          <Link to="/about" className="transition-colors hover:text-foreground">
            About
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/auth" search={{ mode: "signin" }}>
              Sign In
            </Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/auth" search={{ mode: "signup" }}>
              Get Started
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Toggle menu"
            onClick={() => setOpen((prev) => !prev)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-background px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm">
            <a href="/#features">Features</a>
            <a href="/#how-it-works">How it works</a>
            <a href="/#faq">FAQ</a>
            <Link to="/about">About</Link>
            <Link to="/auth" search={{ mode: "signin" }}>
              Sign In
            </Link>
            <Link to="/auth" search={{ mode: "signup" }} className="font-semibold text-primary">
              Get Started
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
