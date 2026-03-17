"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Mail, ArrowLeft, CheckCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { request } from "@/lib/request";
import { toast } from "sonner";

const inputBase =
    "w-full rounded-lg border border-[#D1D5DB] bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15";

export default function ForgotPasswordPage() {
    const emailRef = useRef<HTMLInputElement>(null);
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");

    const startCountdown = () => {
        setCountdown(60);
        const timer = setInterval(() => {
            setCountdown((c) => {
                if (c <= 1) { clearInterval(timer); return 0; }
                return c - 1;
            });
        }, 1000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const val = emailRef.current?.value?.trim() ?? "";
        if (!val) return;
        setError("");
        setLoading(true);
        setEmail(val);

        try {
            await request("/auth/request-password-reset", {
                method: "POST",
                json: { email: val }
            });
            setSent(true);
            startCountdown();
            toast.success("Password reset link sent!");
        } catch (err: any) {
            console.error("Forgot password error:", err);
            setError(err.message || "Failed to send reset link. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0) return;
        setError("");
        setLoading(true);
        try {
            await request("/auth/request-password-reset", {
                method: "POST",
                json: { email }
            });
            startCountdown();
            toast.success("Password reset link sent!");
        } catch (err: any) {
            console.error("Resend error:", err);
            setError(err.message || "Failed to resend. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── Sent state ─────────────────────────────────────────────────────────────
    if (sent) {
        return (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-[0_4px_24px_-4px_rgba(12,24,55,0.12)]">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#DCFCE7]">
                        <CheckCircle className="h-6 w-6 text-[#16A34A]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[#111827]">Check your email</h1>
                        <p className="mt-1.5 text-sm text-[#6B7280]">
                            We sent a password reset link to
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-[#111827]">{email}</p>
                    </div>

                    {/* Open email client shortcut */}
                    <a
                        href="mailto:"
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E40AF]"
                    >
                        <Mail className="h-4 w-4" />
                        Open email app
                    </a>

                    {/* Resend */}
                    <p className="text-xs text-[#6B7280]">
                        Didn&apos;t receive it?{" "}
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={countdown > 0 || loading}
                            className={cn(
                                "inline-flex items-center gap-1 font-semibold transition",
                                countdown > 0 || loading
                                    ? "text-[#9CA3AF] cursor-not-allowed"
                                    : "text-[#1D4ED8] hover:underline underline-offset-2"
                            )}
                        >
                            {loading ? (
                                <><RefreshCw className="h-3 w-3 animate-spin" /> Sending…</>
                            ) : countdown > 0 ? (
                                <>Resend in {countdown}s</>
                            ) : (
                                "Resend email"
                            )}
                        </button>
                    </p>

                    <div className="h-px w-full bg-[#E5E7EB]" />

                    <Link
                        href="/login"
                        className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-[#374151] transition"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to sign in
                    </Link>
                </div>
            </div>
        );
    }

    // ── Input state ────────────────────────────────────────────────────────────
    return (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-[0_4px_24px_-4px_rgba(12,24,55,0.12)]">
            {/* Header */}
            <div className="mb-7 text-center">
                <h1 className="text-xl font-bold text-[#111827]">Forgot password?</h1>
                <p className="mt-1 text-sm text-[#6B7280]">
                    Enter your email and we&apos;ll send you a reset link
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#374151]">Email address</label>
                    <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                        <input
                            ref={emailRef}
                            type="email"
                            required
                            placeholder="you@example.com"
                            className={cn(inputBase, "pl-9")}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E40AF] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <><RefreshCw className="h-4 w-4 animate-spin" /> Sending…</>
                    ) : (
                        "Send reset link"
                    )}
                </button>
                {error && <p className="mt-2 text-center text-xs text-red-500">{error}</p>}
            </form>

            <div className="mt-5 text-center">
                <Link
                    href="/login"
                    className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-[#374151] transition"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to sign in
                </Link>
            </div>
        </div>
    );
}
