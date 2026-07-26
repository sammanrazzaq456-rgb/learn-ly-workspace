import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-display text-lg font-bold">Lumen</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            The AI study companion that reads your documents and turns them into summaries,
            explanations and practice material.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Product</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="/#features" className="hover:text-foreground">
                Features
              </a>
            </li>
            <li>
              <a href="/#how-it-works" className="hover:text-foreground">
                How it works
              </a>
            </li>
            <li>
              <a href="/#faq" className="hover:text-foreground">
                FAQ
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Company</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/about" className="hover:text-foreground">
                About
              </Link>
            </li>
            <li>
              <Link to="/auth" search={{ mode: "signin" }} className="hover:text-foreground">
                Sign in
              </Link>
            </li>
            <li>
              <a href="mailto:hello@lumen.study" className="hover:text-foreground">
                hello@lumen.study
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-6 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Lumen. Built for students who read a lot.
      </div>
    </footer>
  );
}
