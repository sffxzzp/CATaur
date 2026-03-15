"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { request } from "@/lib/request";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputBase =
  "w-full rounded-lg border border-[#D1D5DB] bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15";

// ─── Social signup button ─────────────────────────────────────────────────────

function SocialButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
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

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908C16.658 14.252 17.64 11.945 17.64 9.2z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect width="18" height="18" rx="3" fill="#0A66C2" />
    <path d="M4.5 7.2H6.6V13.5H4.5V7.2ZM5.55 6.3C4.87 6.3 4.5 5.91 4.5 5.4C4.5 4.89 4.88 4.5 5.565 4.5C6.25 4.5 6.6 4.89 6.6 5.4C6.6 5.91 6.23 6.3 5.55 6.3ZM13.5 13.5H11.4V10.2C11.4 9.36 11.07 8.82 10.35 8.82C9.81 8.82 9.495 9.18 9.345 9.525C9.3 9.63 9.285 9.78 9.285 9.945V13.5H7.185V7.2H9.285V8.115C9.585 7.65 10.11 7.05 11.07 7.05C12.255 7.05 13.5 7.74 13.5 9.93V13.5Z" fill="white" />
  </svg>
);

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-[#E5E7EB]" />
      <span className="text-xs text-[#9CA3AF]">{label}</span>
      <div className="h-px flex-1 bg-[#E5E7EB]" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const params = useSearchParams();
  const emailRef = useRef<HTMLInputElement>(null);

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [pwError, setPwError] = useState("");

  const handleRegister = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
      const pw = (form.elements.namedItem("password") as HTMLInputElement).value;
      const confirm = (form.elements.namedItem("confirm") as HTMLInputElement).value;
      
      if (pw !== confirm) { 
        setPwError("Passwords do not match."); 
        return; 
      }
      setPwError("");

      const rawRole = params.get("role")?.toLowerCase() || "candidate";
      const roleMap: Record<string, string> = {
        admin: "Admin",
        administer: "Admin",
        client: "Client",
        recruiter: "Recruiter",
        candidate: "Candidate",
        user: "User",
      };
      const role = roleMap[rawRole] || "Candidate";
      const redirect = params.get("redirect");

      try {
        const data = await request("/auth/register", {
          method: "POST",
          json: { 
            email, 
            password: pw, 
            nickname: email.split('@')[0],
            role: role as any
          },
          skipDefaults: true
        });

        // Backend now returns LoginResponseDto on successful registration
        if (data.access_token) {
          localStorage.setItem("authToken", data.access_token);
        }

        // Set local storage flags based on role
        switch (role) {
          case "recruiter":
            localStorage.setItem("recruiterLoggedIn", "1");
            router.push(redirect || "/recruiter");
            break;
          case "client":
            localStorage.setItem("clientLoggedIn", "1");
            router.push(redirect || "/client");
            break;
          case "administer":
          case "admin":
            localStorage.setItem("adminLoggedIn", "1");
            router.push(redirect || "/administer");
            break;
          default:
            localStorage.setItem("candidateLoggedIn", "1");
            localStorage.setItem("candidateEmail", email);
            localStorage.setItem("candidateName", email.split('@')[0]);
            router.push(redirect || "/candidate");
        }
      } catch (err: any) {
        console.error("Registration Error:", err);
        setPwError(err.message || "Registration failed. Please try again.");
      }
    },
    [params, router]
  );

  const handleSocial = (email: string) => {
    localStorage.setItem("candidateLoggedIn", "1");
    localStorage.setItem("candidateEmail", email);
    router.push("/candidate");
  };

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-[0_4px_24px_-4px_rgba(12,24,55,0.12)]">
      {/* Header */}
      <div className="mb-7 text-center">
        <h1 className="text-xl font-bold text-[#111827]">Create your account</h1>
        <p className="mt-1 text-sm text-[#6B7280]">Start tracking every opportunity in one place</p>
      </div>

      <div className="space-y-5">
        {/* Social */}
        <div className="grid grid-cols-2 gap-3">
          <SocialButton icon={<GoogleIcon />} label="Google" onClick={() => handleSocial("google-user@gmail.com")} />
          <SocialButton icon={<LinkedInIcon />} label="LinkedIn" onClick={() => handleSocial("linkedin-user@linkedin.com")} />
        </div>

        <Divider label="or sign up with email" />

        {/* Email + password form */}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#374151]">Email address</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                ref={emailRef}
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className={cn(inputBase, "pl-9")}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#374151]">Password</label>
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
                className={cn(inputBase, "pl-9 pr-9", pwError ? "border-red-400 focus:border-red-400 focus:ring-red-400/15" : "")}
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
            {pwError && <p className="text-xs text-red-500">{pwError}</p>}
          </div>

          {/* Terms */}
          <label className="flex cursor-pointer items-start gap-2.5 text-xs text-[#6B7280]">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded border-[#D1D5DB] accent-[#1D4ED8]"
            />
            <span>
              I agree to the{" "}
              <Link href="#terms" className="text-[#1D4ED8] hover:underline underline-offset-2">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#privacy" className="text-[#1D4ED8] hover:underline underline-offset-2">
                Privacy Policy
              </Link>
            </span>
          </label>

          <button
            type="submit"
            disabled={!agreed}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E40AF] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create account <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-xs text-[#6B7280]">
          Already have an account?{" "}
          <Link
            href={`/login${params.get("role") ? `?role=${params.get("role")}` : ""}`}
            className="font-semibold text-[#1D4ED8] hover:underline underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
