"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { request } from "@/lib/request";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";


// ─── Shared primitives ────────────────────────────────────────────────────────

const inputBase =
    "w-full rounded-lg border border-[#D1D5DB] bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15";

// ─── Social login button ───────────────────────────────────────────────────────

function SocialButton({
    icon,
    label,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-[#D1D5DB] bg-white px-4 py-2.5 text-sm font-medium text-[#374151] transition hover:border-[#9CA3AF] hover:bg-[#F9FAFB]"
        >
            {icon}
            {label}
        </button>
    );
}

// ─── Google SVG ───────────────────────────────────────────────────────────────

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908C16.658 14.252 17.64 11.945 17.64 9.2z" fill="#4285F4" />
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
);

// ─── LinkedIn SVG ─────────────────────────────────────────────────────────────

const LinkedInIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect width="18" height="18" rx="3" fill="#0A66C2" />
        <path d="M4.5 7.2H6.6V13.5H4.5V7.2ZM5.55 6.3C4.87 6.3 4.5 5.91 4.5 5.4C4.5 4.89 4.88 4.5 5.565 4.5C6.25 4.5 6.6 4.89 6.6 5.4C6.6 5.91 6.23 6.3 5.55 6.3ZM13.5 13.5H11.4V10.2C11.4 9.36 11.07 8.82 10.35 8.82C9.81 8.82 9.495 9.18 9.345 9.525C9.3 9.63 9.285 9.78 9.285 9.945V13.5H7.185V7.2H9.285V8.115C9.585 7.65 10.11 7.05 11.07 7.05C12.255 7.05 13.5 7.74 13.5 9.93V13.5Z" fill="white" />
    </svg>
);

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#E5E7EB]" />
            <span className="text-xs text-[#9CA3AF]">{label}</span>
            <div className="h-px flex-1 bg-[#E5E7EB]" />
        </div>
    );
}

// ─── Password form ────────────────────────────────────────────────────────────

function PasswordForm({ onSubmit, isPending, errorMsg }: { onSubmit: (email: string, pw: string) => void, isPending?: boolean, errorMsg?: string | null }) {
    const [showPw, setShowPw] = useState(false);
    const emailRef = useRef<HTMLInputElement>(null);
    const pwRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(emailRef.current?.value?.trim() ?? "", pwRef.current?.value ?? "");
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 font-medium">
                    {errorMsg}
                </div>
            )}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#374151]">Email address</label>
                <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                    <input
                        ref={emailRef}
                        id="email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        className={cn(inputBase, "pl-9")}
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#374151]">Password</label>
                    <Link href="/forgot-password" className="text-xs font-medium text-[#1D4ED8] hover:underline underline-offset-2">
                        Forgot password?
                    </Link>
                </div>
                <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                    <input
                        ref={pwRef}
                        id="password"
                        type={showPw ? "text" : "password"}
                        required
                        placeholder="Enter password"
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

            <button
                type="submit"
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E40AF] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isPending ? "Signing in..." : <>Sign in <ArrowRight className="h-4 w-4" /></>}
            </button>
        </form>
    );
}

// ─── OTP form ─────────────────────────────────────────────────────────────────

function OtpForm({ onSubmit, isPending, errorMsg }: { onSubmit: (email: string, code: string) => void, isPending?: boolean, errorMsg?: string | null }) {
    const [sent, setSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const emailRef = useRef<HTMLInputElement>(null);
    const codeRef = useRef<HTMLInputElement>(null);

    const sendCode = async () => {
        const email = emailRef.current?.value?.trim() ?? "";
        if (!email) return;
        
        setSending(true);
        try {
            await request("/auth/request-verification-code", {
                method: "POST",
                json: { email }
            });
            setSent(true);
            setCountdown(60);
            const timer = setInterval(() => {
                setCountdown((c) => {
                    if (c <= 1) { clearInterval(timer); return 0; }
                    return c - 1;
                });
            }, 1000);
        } catch (err: any) {
            console.error("Send code error:", err);
            // Error handling is managed by the parent via errorMsg usually, 
            // but we can alert here or just let it fail.
        } finally {
            setSending(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(emailRef.current?.value?.trim() ?? "", codeRef.current?.value?.trim() ?? "");
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 font-medium">
                    {errorMsg}
                </div>
            )}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#374151]">Email address</label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                        <input
                            ref={emailRef}
                            type="email"
                            required
                            placeholder="you@example.com"
                            className={cn(inputBase, "pl-9")}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={sendCode}
                        disabled={countdown > 0 || sending}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#1D4ED8] px-3 py-2 text-xs font-semibold text-[#1D4ED8] transition hover:bg-[#EFF6FF] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending ? (
                             <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : countdown > 0 ? (
                            <>{countdown}s</>
                        ) : (
                            sent ? "Resend" : "Send code"
                        )}
                    </button>
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#374151]">Verification code</label>
                <input
                    ref={codeRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    placeholder="6-digit code"
                    className={inputBase}
                    disabled={!sent}
                />
                {!sent && (
                    <p className="text-xs text-[#9CA3AF]">Enter your email and click Send code first.</p>
                )}
            </div>

            <button
                type="submit"
                disabled={!sent || isPending}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E40AF] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isPending ? "Signing in..." : <>Sign in <ArrowRight className="h-4 w-4" /></>}
            </button>
        </form>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CandidateLoginPage() {
    const router = useRouter();
    const params = useSearchParams();
    const [tab, setTab] = useState<"password" | "otp">("password");
    
    // Auth State
    const [isPending, setIsPending] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handlePasswordLogin = useCallback(
        async (email: string, pw: string) => {
            setIsPending(true);
            setErrorMsg(null);
            
            try {
                // Now using the request wrapper to make use of dynamic process.env handling or proxy
                const data = await request("/auth/login/password", {
                    method: "POST",
                    json: { email, password: pw },
                    skipDefaults: true // Since it's login, no need for token
                });
                
                if (data.mfa_required) {
                    throw new Error("MFA is required but not yet supported in this UI snippet.");
                }
                
                if (data.access_token) {
                    localStorage.setItem("authToken", data.access_token);
                }
                
                localStorage.setItem("candidateLoggedIn", "1");
                localStorage.setItem("candidateEmail", data.email || email);
                localStorage.setItem("candidateName", data.email ? data.email.split('@')[0] : "Candidate");
                
                const redirect = params.get("redirect");
                router.push(redirect || "/candidate");

            } catch (err: any) {
                console.error("Login Error:", err);
                setErrorMsg(err.message || "An unexpected error occurred");
            } finally {
                setIsPending(false);
            }
        },
        [params, router]
    );

    const handleOtpLogin = useCallback(
        async (email: string, code: string) => {
            setIsPending(true);
            setErrorMsg(null);
            
            try {
                const data = await request("/auth/login/verification-code", {
                    method: "POST",
                    json: { email, code },
                    skipDefaults: true
                });
                
                if (data.mfa_required) {
                    throw new Error("MFA is required but not yet supported.");
                }
                
                if (data.access_token) {
                    localStorage.setItem("authToken", data.access_token);
                }
                
                localStorage.setItem("candidateLoggedIn", "1");
                localStorage.setItem("candidateEmail", data.email || email);
                localStorage.setItem("candidateName", data.email ? data.email.split('@')[0] : "Candidate");
                
                const redirect = params.get("redirect");
                router.push(redirect || "/candidate");

            } catch (err: any) {
                console.error("OTP Login Error:", err);
                setErrorMsg(err.message || "Invalid verification code");
            } finally {
                setIsPending(false);
            }
        },
        [params, router]
    );

    const handleSocialLogin = async (provider: 'google' | 'linkedin') => {
        if (provider !== 'google') {
            setErrorMsg("LinkedIn login is not implemented yet.");
            return;
        }

        setIsPending(true);
        setErrorMsg(null);

        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();

            const data = await request("/auth/login/google", {
                method: "POST",
                json: { idToken },
                skipDefaults: true
            });

            if (data.access_token) {
                localStorage.setItem("authToken", data.access_token);
            }

            localStorage.setItem("candidateLoggedIn", "1");
            localStorage.setItem("candidateEmail", data.email);
            localStorage.setItem("candidateName", data.email.split('@')[0]);

            const redirect = params.get("redirect");
            router.push(redirect || "/candidate");

        } catch (err: any) {
            console.error("Google Login Error:", err);
            setErrorMsg(err.message || "Google Login failed");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-[0_4px_24px_-4px_rgba(12,24,55,0.12)]">
            {/* Header */}
            <div className="mb-7 text-center">
                <h1 className="text-xl font-bold text-[#111827]">Sign in to CATaur</h1>
                <p className="mt-1 text-sm text-[#6B7280]">Find your next opportunity</p>
            </div>

            {/* Social login */}
            <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                    <SocialButton icon={<GoogleIcon />} label="Google" onClick={() => handleSocialLogin("google")} />
                    <SocialButton icon={<LinkedInIcon />} label="LinkedIn" onClick={() => handleSocialLogin("linkedin")} />
                </div>


                <Divider label="or sign in with email" />

                {/* Tabs */}
                <div className="flex rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-1">
                    <button
                        type="button"
                        onClick={() => setTab("password")}
                        className={cn(
                            "flex-1 rounded-md py-1.5 text-xs font-medium transition",
                            tab === "password" ? "bg-white text-[#111827] shadow-sm" : "text-[#6B7280] hover:text-[#374151]"
                        )}
                    >
                        Password
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("otp")}
                        className={cn(
                            "flex-1 rounded-md py-1.5 text-xs font-medium transition",
                            tab === "otp" ? "bg-white text-[#111827] shadow-sm" : "text-[#6B7280] hover:text-[#374151]"
                        )}
                    >
                        Verification code
                    </button>
                </div>

                {tab === "password" ? (
                    <PasswordForm onSubmit={handlePasswordLogin} isPending={isPending} errorMsg={errorMsg} />
                ) : (
                    <OtpForm onSubmit={handleOtpLogin} isPending={isPending} errorMsg={errorMsg} />
                )}

                {/* Create account */}
                <p className="text-center text-xs text-[#6B7280]">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="font-semibold text-[#1D4ED8] hover:underline underline-offset-2">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}
