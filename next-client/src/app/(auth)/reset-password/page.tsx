"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Lock, Eye, EyeOff, CheckCircle, RefreshCw, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { request } from "@/lib/request";

const inputBase =
    "w-full rounded-lg border border-[#D1D5DB] bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const pw = (form.elements.namedItem("password") as HTMLInputElement).value;
        const confirm = (form.elements.namedItem("confirm") as HTMLInputElement).value;
        
        if (!token) {
            setError("Reset token is missing. Please check your email link.");
            return;
        }
        if (pw !== confirm) {
            setError("Passwords do not match.");
            return;
        }
        if (pw.length < 12) {
            setError("Password must be at least 12 characters.");
            return;
        }

        setError("");
        setLoading(true);
        
        try {
            await request("/auth/reset-password", {
                method: "POST",
                json: {
                    token,
                    newPassword: pw
                }
            });
            setDone(true);
        } catch (err: any) {
            console.error("Reset password error:", err);
            setError(err.message || "Failed to reset password. The link may be expired.");
        } finally {
            setLoading(false);
        }
    };

    // ── Success state ──────────────────────────────────────────────────────────
    if (done) {
        return (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-[0_4px_24px_-4px_rgba(12,24,55,0.12)]">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#DCFCE7]">
                        <CheckCircle className="h-6 w-6 text-[#16A34A]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[#111827]">Password updated</h1>
                        <p className="mt-1.5 text-sm text-[#6B7280]">
                            Your password has been reset successfully.
                        </p>
                    </div>
                    <Link
                        href="/candidate-login"
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E40AF]"
                    >
                        Sign in <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        );
    }

    // ── Form state ─────────────────────────────────────────────────────────────
    return (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-[0_4px_24px_-4px_rgba(12,24,55,0.12)]">
            {/* Header */}
            <div className="mb-7 text-center">
                <h1 className="text-xl font-bold text-[#111827]">Set new password</h1>
                <p className="mt-1 text-sm text-[#6B7280]">
                    12+ chars, include upper, lower, number & symbol
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* New password */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#374151]">New password</label>
                    <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                        <input
                            name="password"
                            type={showPw ? "text" : "password"}
                            required
                            minLength={8}
                            placeholder="At least 8 characters"
                            className={cn(inputBase, "pl-9 pr-9")}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPw((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151] transition"
                            tabIndex={-1}
                        >
                            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#374151]">Confirm password</label>
                    <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                        <input
                            name="confirm"
                            type={showConfirm ? "text" : "password"}
                            required
                            placeholder="Repeat password"
                            className={cn(
                                inputBase,
                                "pl-9 pr-9",
                                error ? "border-red-400 focus:border-red-400 focus:ring-red-400/15" : ""
                            )}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151] transition"
                            tabIndex={-1}
                        >
                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E40AF] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <><RefreshCw className="h-4 w-4 animate-spin" /> Updating…</>
                    ) : (
                        <>Reset password <ArrowRight className="h-4 w-4" /></>
                    )}
                </button>
            </form>

            <div className="mt-5 text-center">
                <Link
                    href="/candidate-login"
                    className="text-xs font-medium text-[#6B7280] hover:text-[#374151] transition"
                >
                    Back to sign in
                </Link>
            </div>
        </div>
    );
}
