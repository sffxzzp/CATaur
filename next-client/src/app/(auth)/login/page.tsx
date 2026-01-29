"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

const inputClass =
  "w-full rounded-2xl border border-border/70 bg-white px-4 py-3 text-sm text-foreground shadow-[0_8px_24px_-18px_rgba(12,24,55,0.3)] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const role = params.get("role") ?? "candidate";
  const redirect = params.get("redirect");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const toast = useToast();

  const { title, subtitle } = useMemo(() => {
    switch (role) {
      case "recruiter":
        return {
          title: "Recruiter Console Login",
          subtitle: "Internal access for recruiters to manage job orders and pipelines.",
        };
      case "client":
        return {
          title: "Client Portal Login",
          subtitle: "Review submitted candidates and decisions for your roles.",
        };
      case "administer":
      case "admin":
        return {
          title: "Admin Console Login",
          subtitle: "Manage users, roles, email, and AI settings.",
        };
      default:
        return {
          title: "Candidate Login",
          subtitle: "Sign in to track your applications and manage your profile.",
        };
    }
  }, [role]);

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);
      if (!email) {
        setEmailError("Email is required");
        return;
      }
      if (emailError) return;
      setLoading(true);
      try {
        const res = await authClient.login({ email, password });
        if (res?.user?.role === "candidate") {
          localStorage.setItem("candidateLoggedIn", "1");
        }
        window.dispatchEvent(new Event("auth-updated"));
        setSuccess("Welcome back. Redirecting you to your dashboard...");
        toast.push({
          tone: "success",
          title: "Secure login successful",
          description: redirect
            ? "We found your session and are taking you to your destination."
            : "You’re back in. Preparing your workspace now.",
        });
        setTimeout(() => router.replace(redirect || "/candidate"), 380);
      } catch (err: any) {
        setError(err?.message || "Unable to log in");
      } finally {
        setLoading(false);
      }
    },
    [email, password, redirect, router, toast, emailError]
  );

  return (
    <div className="rounded-[32px] border border-border bg-white/95 p-8 shadow-[0_32px_80px_-60px_rgba(12,24,55,0.65)]">
      <div className="flex items-center gap-3 text-left">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleLogin}>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            onBlur={() => {
              if (!email) {
                setEmailError("Email is required");
                return;
              }
              const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
              setEmailError(valid ? null : "Enter a valid email");
            }}
            className={inputClass}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
          {emailError && <p className="text-xs font-medium text-danger">{emailError}</p>}
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="Enter password"
            required
            autoComplete="current-password"
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" className="h-4 w-4 rounded border-border accent-primary" />
            Remember me
          </label>
          <Link
            href={`/forgot${email ? `?email=${encodeURIComponent(email)}` : ""}`}
            className="font-medium text-primary transition hover:text-primary-soft"
          >
            Forgot password?
          </Link>
        </div>

        {error && (
          <div className="rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
        )}
        {success && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
            {success}
          </div>
        )}

        <Button
          className={cn("w-full", loading && "cursor-wait opacity-80")}
          type="submit"
          disabled={loading || !email || !!emailError}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Securing your session...
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>
      {(!params.get("role") || params.get("role") === "candidate") && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to CATaur?{" "}
          <Link href="/register" className="font-medium text-primary transition hover:text-primary-soft">
            Create an account
          </Link>
        </p>
      )}
    </div>
  );
}
