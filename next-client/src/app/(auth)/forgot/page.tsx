"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, MailCheck, ShieldCheck, Timer } from "lucide-react";

const inputClass =
  "w-full rounded-2xl border border-border/70 bg-white px-4 py-3 text-sm text-foreground shadow-[0_8px_24px_-18px_rgba(12,24,55,0.3)] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted";

export default function ForgotPage() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [expires, setExpires] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sent">("idle");
  const [emailError, setEmailError] = useState<string | null>(null);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setToken(null);
    setExpires(null);
    if (!email) {
      setEmailError("Email is required");
      setLoading(false);
      return;
    }
    if (emailError) {
      setLoading(false);
      return;
    }
    try {
      const res = await authClient.forgot(email.trim());
      setStatus("sent");
      setMessage(
        res.message || "If that email exists, we emailed reset instructions. Please follow the link inside the next 30 minutes."
      );
      if (res.token) setToken(res.token);
      if (res.expiresAt) setExpires(res.expiresAt);
      toast.push({
        tone: "info",
        title: "Check your inbox",
        description: "We sent a time-bound reset link. Follow it to finish the reset.",
      });
    } catch (err: any) {
      setError(err?.message || "Unable to start reset flow");
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token).catch(() => undefined);
  };

  return (
    <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[28px] border border-border/70 bg-white/98 p-6 shadow-[0_24px_72px_-54px_rgba(12,24,55,0.6)]">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-10 top-6 h-40 w-40 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute bottom-0 right-[-1.5rem] h-60 w-60 rounded-full bg-accent/12 blur-3xl" />
      </div>

      <div className="relative space-y-5">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Password reset</p>
            <h1 className="text-2xl font-semibold text-foreground">Send a secure reset link</h1>
            <p className="text-sm text-muted-foreground">We’ll email a single-use link that expires in ~30 minutes.</p>
          </div>
          {status === "sent" && (
            <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
              <CheckCircle2 className="h-4 w-4" /> Link sent
            </span>
          )}
        </header>

        <div className="rounded-[22px] border border-border bg-white p-7 shadow-[0_20px_58px_-50px_rgba(12,24,55,0.55)]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Work email
              </label>
              <input
                id="email"
                type="email"
                className={inputClass}
                placeholder="you@company.com"
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
                required
              />
              {emailError && <p className="text-xs font-medium text-danger">{emailError}</p>}
            </div>

            {error && <div className="rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}
            {message && (
              <div className="flex items-start gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
                <MailCheck className="mt-0.5 h-4 w-4" />
                <div>
                  <p className="font-semibold">{message}</p>
                  <p className="text-xs text-primary/80">Open from your inbox; the link is time-bound for safety.</p>
                </div>
              </div>
            )}

            <Button className={cn("w-full", loading && "cursor-wait opacity-80")} type="submit" disabled={loading || !!emailError}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending secure link...
                </>
              ) : status === "sent" ? (
                <>
                  Send again <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Send reset link <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <div className="grid gap-3 rounded-2xl border border-border/70 bg-surface px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Link works only for this request.
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Timer className="h-4 w-4" />
                Expires fast; request again if it lapses.
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Remembered your password?{" "}
              <Link href="/login" className="font-medium text-primary transition hover:text-primary-soft">
                Back to login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
