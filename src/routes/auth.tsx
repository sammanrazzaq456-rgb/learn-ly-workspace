import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import authIllustration from "@/assets/auth-illustration.jpg";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup", "forgot"]).catch("signin"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in to Lumen" },
      { name: "description", content: "Sign in or create your Lumen account to start studying." },
      { property: "og:title", content: "Sign in to Lumen" },
      {
        property: "og:description",
        content: "Sign in or create your Lumen account to start studying.",
      },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email({ message: "Enter a valid email address" }).max(255),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }).max(72),
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const setMode = (next: "signin" | "signup" | "forgot") =>
    navigate({ to: "/auth", search: { mode: next } });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "forgot") {
        const parsed = z.string().email().safeParse(email.trim());
        if (!parsed.success) {
          toast.error("Enter a valid email address");
          return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset link sent. Check your inbox.");
        return;
      }

      const parsed = credentials.safeParse({ email, password });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return;
      }

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        toast.success("Account created. Welcome to Lumen!");
        navigate({ to: "/dashboard" });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (error) throw error;
      window.localStorage.setItem("lumen-remember", remember ? "1" : "0");
      toast.success("Welcome back");
      navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Google sign-in failed");
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  const title =
    mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset password" : "Welcome back";
  const subtitle =
    mode === "signup"
      ? "Start turning documents into study material."
      : mode === "forgot"
        ? "We'll email you a link to set a new password."
        : "Sign in to pick up where you left off.";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img
          src={authIllustration}
          alt="Illustration of a study desk with AI-generated document cards"
          width={1024}
          height={1280}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <p className="font-display text-2xl font-semibold">
            Read once. Understand, revise and test yourself with Lumen.
          </p>
        </div>
      </div>

      <div className="surface-grain flex items-center justify-center px-6 py-14">
        <div className="glass-card w-full max-w-md rounded-3xl p-8 shadow-2xl">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-display text-lg font-bold">Lumen</span>
          </Link>

          <h1 className="mt-8 text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {mode === "signup" ? (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  maxLength={100}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Ada Lovelace"
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@university.edu"
                required
              />
            </div>

            {mode !== "forgot" ? (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  required
                />
              </div>
            ) : null}

            {mode === "signin" ? (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={remember}
                    onCheckedChange={(value) => setRemember(value === true)}
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            ) : null}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign In"}
            </Button>
          </form>

          {mode !== "forgot" ? (
            <>
              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleGoogle}
                disabled={loading}
              >
                <GoogleIcon />
                Continue with Google
              </Button>
            </>
          ) : null}

          <p className="mt-7 text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button onClick={() => setMode("signin")} className="font-medium text-primary hover:underline">
                  Sign in
                </button>
              </>
            ) : mode === "forgot" ? (
              <button onClick={() => setMode("signin")} className="font-medium text-primary hover:underline">
                Back to sign in
              </button>
            ) : (
              <>
                New to Lumen?{" "}
                <button onClick={() => setMode("signup")} className="font-medium text-primary hover:underline">
                  Create an account
                </button>
              </>
            )}
          </p>

          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            We only email you about your account.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.5 30.2 0 24 0 14.6 0 6.4 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7c4.3-4 6.8-9.9 6.8-17.2z"
      />
      <path
        fill="#FBBC05"
        d="M10.4 28.7a14.5 14.5 0 0 1 0-9.4l-7.8-6.1a24 24 0 0 0 0 21.6l7.8-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.2 0 11.5-2 15.3-5.6l-7.4-5.7c-2.1 1.4-4.8 2.3-7.9 2.3-6.4 0-11.7-3.7-13.6-8.8l-7.8 6.1C6.4 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}
