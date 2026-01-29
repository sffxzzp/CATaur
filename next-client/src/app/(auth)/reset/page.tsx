"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, Lock, ShieldCheck, Circle } from "lucide-react";

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


export default function ResetPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState(params.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const passwordMismatch = confirm.length > 0 && password.length > 0 && confirm !== password;
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordMismatch) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await authClient.reset({ token, password });
      setSuccess(res.message || "Password reset successful");
      setTimeout(() => router.replace("/login"), 600);
    } catch (err: any) {
      setError(err?.message || "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[32px] border border-border bg-white/95 p-8 shadow-[0_32px_80px_-60px_rgba(12,24,55,0.65)]">
      <div className="flex items-center gap-3 text-left">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Set a new password</h1>
          <p className="text-sm text-muted">Paste the token we issued and choose a strong password.</p>
        </div>
        <div className="ml-auto hidden items-center gap-2 rounded-full bg-surface px-4 py-2 text-xs font-semibold text-primary md:flex">
          <ShieldCheck className="h-4 w-4" /> Token validation enforced
        </div>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor="token" className="text-sm font-medium text-foreground">
            Reset token
          </label>
          <input
            id="token"
            className={inputClass}
            placeholder="Paste the reset token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              New password
            </label>
            <input
              id="password"
              type="password"
              className={inputClass}
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
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
            <p className="text-xs text-muted-foreground">Use 8+ chars with upper, lower, number, and symbol.</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm" className="text-sm font-medium text-foreground">
              Confirm password
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
          <div className="flex items-center gap-2 rounded-2xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" /> {success}
          </div>
        )}

        <Button
          className={cn("w-full", loading && "cursor-wait opacity-80")}
          type="submit"
          disabled={loading || passwordMismatch}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Validating token...
            </>
          ) : (
            "Update password"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Done here?{" "}
          <Link href="/login" className="font-medium text-primary transition hover:text-primary-soft">
            Return to login
          </Link>
        </p>
      </form>
    </div>
  );
}
