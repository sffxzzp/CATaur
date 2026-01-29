"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Loader2, CheckCircle2, Circle } from "lucide-react";

const inputClass =
  "w-full rounded-2xl border border-border/70 bg-white px-4 py-3 text-sm text-foreground shadow-[0_8px_24px_-18px_rgba(12,24,55,0.3)] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted";

const strengthLevels = [
  { label: "Too weak", className: "bg-rose-200 text-rose-700" },
  { label: "Weak", className: "bg-amber-200 text-amber-700" },
  { label: "Fair", className: "bg-yellow-200 text-yellow-800" },
  { label: "Good", className: "bg-emerald-200 text-emerald-800" },
  { label: "Strong", className: "bg-emerald-300 text-emerald-900" },
];

function getPasswordStrength(password: string) {
  const tests = [/.{8,}/, /[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/];
  const score = tests.reduce((acc, test) => acc + (test.test(password) ? 1 : 0), 0);
  return { score, ...strengthLevels[Math.max(0, score - 1)] };
}

const passwordRequirements = [
  { label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
  { label: "Uppercase letter", test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "Lowercase letter", test: (pw: string) => /[a-z]/.test(pw) },
  { label: "Number", test: (pw: string) => /\d/.test(pw) },
  { label: "Symbol", test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
];

export default function RegisterPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeStatus, setCodeStatus] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const passwordMismatch = confirm.length > 0 && password.length > 0 && confirm !== password;
  const toast = useToast();
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const handleRegister = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (passwordMismatch) {
        setError("Passwords do not match");
        return;
      }
      if (!email) {
        setEmailError("Email is required");
        return;
      }
      if (emailError) return;
      if (!code) {
        setError("Please enter the verification code we emailed you");
        return;
      }
      setError(null);
      setSuccess(null);
      setLoading(true);
      const redirect = params.get("redirect");

      try {
        await authClient.register({
          email: email.trim().toLowerCase(),
          password,
          fullName,
          role: "candidate",
          code: code.trim(),
        });
        setSuccess("Account created. Please sign in to continue.");
        toast.push({
          tone: "success",
          title: "Account created successfully",
          description: "We’ve set up your profile. Sign in to start your session.",
        });
        const next = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login";
        setTimeout(() => router.replace(next), 400);
      } catch (err: any) {
        setError(err?.message || "Unable to create account");
      } finally {
        setLoading(false);
      }
    },
    [confirm, email, fullName, password, params, router, emailError, passwordMismatch, code, toast]
  );

  const sendCode = async () => {
    if (!email) {
      setEmailError("Email is required");
      return;
    }
    if (emailError) return;
    const trimmedEmail = email.trim().toLowerCase();
    setSendingCode(true);
    setCodeStatus(null);
    setCodeError(null);
    try {
      const res = await authClient.sendVerification(trimmedEmail);
      setCodeStatus(res.message || "Verification code sent");
      setCooldown(60);
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setCodeError(err?.message || "Failed to send code");
    } finally {
      setSendingCode(false);
    }
  };

  return (
    <div className="rounded-[32px] border border-border bg-white/95 p-8 shadow-[0_32px_80px_-60px_rgba(12,24,55,0.65)]">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Create your CATaur account</h1>
        <p className="text-sm text-muted">
          Build your profile once and track every opportunity in one place.
        </p>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleRegister}>
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            Full name <span className="text-danger">*</span>
          </label>
          <input
            id="name"
            className={inputClass}
            placeholder="Alex Rivera"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email address <span className="text-danger">*</span>
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex-1">
              <input
                id="email"
                type="email"
                className={inputClass}
                placeholder="you@example.com"
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
                autoComplete="email"
              />
              {emailError && <p className="mt-1 text-xs font-medium text-danger">{emailError}</p>}
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="sm:w-40"
              onClick={sendCode}
              disabled={sendingCode || !!emailError || cooldown > 0}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : sendingCode ? "Sending..." : "Send code"}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="code" className="text-sm font-medium text-foreground">
            Verification code <span className="text-danger">*</span>
          </label>
          <input
            id="code"
            className={inputClass}
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            inputMode="numeric"
            maxLength={6}
          />
          {codeStatus && <p className="text-xs font-medium text-primary">{codeStatus}</p>}
          {codeError && <p className="text-xs font-medium text-danger">{codeError}</p>}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password <span className="text-danger">*</span>
            </label>
            <input
              id="password"
              type="password"
              className={inputClass}
              placeholder="Create password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <div className="flex flex-1 overflow-hidden rounded-full bg-slate-100">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className={cn("h-2 flex-1", i <= passwordStrength.score ? passwordStrength.className : "bg-slate-200")}
                  />
                ))}
              </div>
              <span className="whitespace-nowrap font-medium">{passwordStrength.label}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
              {passwordRequirements.map((req) => {
                const ok = req.test(password);
                const Icon = ok ? CheckCircle2 : Circle;
                return (
                  <div key={req.label} className="flex items-center gap-2">
                    <Icon className={cn("h-3.5 w-3.5", ok ? "text-emerald-600" : "text-slate-300")} />
                    <span className={cn(ok ? "text-emerald-700" : "text-slate-500")}>{req.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm" className="text-sm font-medium text-foreground">
              Confirm password <span className="text-danger">*</span>
            </label>
            <input
              id="confirm"
              type="password"
              className={inputClass}
              placeholder="Repeat password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            {passwordMismatch && (
              <p className="text-xs font-medium text-danger">Passwords do not match</p>
            )}
          </div>
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
          disabled={loading || passwordMismatch || !!emailError}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary transition hover:text-primary-soft">
          Log in
        </Link>
      </p>
    </div>
  );
}
