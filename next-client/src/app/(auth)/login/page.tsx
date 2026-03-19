"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { request } from "@/lib/request";
import { auth, googleProvider, githubProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { toast } from "sonner";

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

// ─── GitHub SVG ─────────────────────────────────────────────────────────────
const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      d="M9 0C4.03 0 0 4.03 0 9c0 3.97 2.58 7.35 6.16 8.54.45.08.62-.2.62-.43v-1.51c-2.5.54-3.03-1.2-3.03-1.2-.41-1.04-.99-1.32-.99-1.32-.82-.56.06-.55.06-.55.91.06 1.39.93 1.39.93.81 1.38 2.11.98 2.63.75.08-.58.32-.98.57-1.21-1.99-.23-4.09-.99-4.09-4.43 0-.98.35-1.78.93-2.41-.09-.23-.4-1.14.09-2.38 0 0 .75-.24 2.47.92.71-.2 1.48-.3 2.24-.3.76 0 1.53.1 2.24.3 1.72-1.16 2.47-.92 2.47-.92.49 1.24.18 2.15.09 2.38.58.63.93 1.43.93 2.41 0 3.45-2.11 4.2-4.11 4.42.32.28.61.82.61 1.66v2.47c0 .23.16.51.62.43A8.997 8.997 0 0018 9c0-4.97-4.03-9-9-9z"
      fill="#181717"
    />
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

function PasswordForm({ onSubmit, isPending, isManager }: { onSubmit: (email: string, pw: string) => void, isPending?: boolean, isManager?: boolean }) {
  const [showPw, setShowPw] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [pwError, setPwError] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);

  const validateEmail = (email: string) => {
    if (!email) return "Email is required";
    if (email.length >= 128) return "Email has reached maximum length (128 characters)";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validatePassword = (pw: string) => {
    if (!pw) return "Password is required";
    if (pw.length >= 128) return "Password has reached maximum length (128 characters)";
    return "";
  };

  const handleEmailBlur = () => {
    const email = emailRef.current?.value?.trim() ?? "";
    setEmailError(validateEmail(email));
  };

  const handleEmailInput = () => {
    const email = emailRef.current?.value ?? "";
    if (email.length >= 128) {
      setEmailError("Email has reached maximum length (128 characters)");
    } else if (emailError) {
      setEmailError("");
    }
  };

  const handlePwBlur = () => {
    const pw = pwRef.current?.value ?? "";
    setPwError(validatePassword(pw));
  };

  const handlePwInput = () => {
    const pw = pwRef.current?.value ?? "";
    if (pw.length >= 128) {
      setPwError("Password has reached maximum length (128 characters)");
    } else if (pwError) {
      setPwError("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailRef.current?.value?.trim() ?? "";
    const pw = pwRef.current?.value ?? "";

    const emailErr = validateEmail(email);
    const pwErr = validatePassword(pw);

    setEmailError(emailErr);
    setPwError(pwErr);

    if (!emailErr && !pwErr) {
      onSubmit(email, pw);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#374151]">Email address</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            ref={emailRef}
            id="email"
            type="email"
            maxLength={128}
            placeholder="you@example.com"
            onBlur={handleEmailBlur}
            onInput={handleEmailInput}
            className={cn(inputBase, "pl-9", emailError && "border-red-500 focus:border-red-500 focus:ring-red-500/15")}
          />
        </div>
        {emailError && <p className="text-xs text-red-600">{emailError}</p>}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-[#374151]">Password</label>
          {!isManager && (
            <Link href="/forgot-password" className="text-xs font-medium text-[#1D4ED8] hover:underline underline-offset-2">
              Forgot password?
            </Link>
          )}
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            ref={pwRef}
            id="password"
            type={showPw ? "text" : "password"}
            maxLength={128}
            placeholder="Enter password"
            onBlur={handlePwBlur}
            onInput={handlePwInput}
            className={cn(inputBase, "pl-9 pr-9", pwError && "border-red-500 focus:border-red-500 focus:ring-red-500/15")}
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
        {pwError && <p className="text-xs text-red-600">{pwError}</p>}
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

function OtpForm({ onSubmit, isPending, onError }: { onSubmit: (email: string, code: string) => void, isPending?: boolean, onError: (msg: string) => void }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emailError, setEmailError] = useState("");
  const [codeError, setCodeError] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  const validateEmail = (email: string) => {
    if (!email) return "Email is required";
    if (email.length >= 128) return "Email has reached maximum length (128 characters)";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validateCode = (code: string) => {
    if (!code) return "";
    if (!/^\d*$/.test(code)) return "Verification code must contain only numbers";
    if (code.length > 0 && code.length < 6) return "Verification code must be 6 digits";
    return "";
  };

  const handleEmailBlur = () => {
    const email = emailRef.current?.value?.trim() ?? "";
    setEmailError(validateEmail(email));
  };

  const handleEmailInput = () => {
    const email = emailRef.current?.value ?? "";
    if (email.length >= 128) {
      setEmailError("Email has reached maximum length (128 characters)");
    } else if (emailError) {
      setEmailError("");
    }
  };

  const handleCodeInput = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const value = input.value;
    // Only allow digits
    input.value = value.replace(/\D/g, "");
    setCodeError(validateCode(input.value));
  };

  // ==========================================
  // [FRONTEND] Request Verification Code
  // Purpose: Sends the user's email to the backend to trigger an OTP email via AWS SES / Nodemailer.
  // ==========================================
  const sendCode = async () => {
    const email = emailRef.current?.value?.trim() ?? "";
    const emailErr = validateEmail(email);

    if (emailErr) {
      setEmailError(emailErr);
      return;
    }
    setEmailError("");

    setSending(true);
    try {
      await request("/auth/request-verification-code", {
        method: "POST",
        json: { email },
        skipDefaults: true
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
      onError(err.message || "Failed to send verification code.");
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailRef.current?.value?.trim() ?? "";
    const code = codeRef.current?.value?.trim() ?? "";

    const emailErr = validateEmail(email);
    const codeErr = code.length !== 6 ? "Verification code must be 6 digits" : "";

    setEmailError(emailErr);
    setCodeError(codeErr);

    if (!emailErr && !codeErr) {
      onSubmit(email, code);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#374151]">Email address</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              ref={emailRef}
              type="email"
              maxLength={128}
              placeholder="you@example.com"
              onBlur={handleEmailBlur}
              onInput={handleEmailInput}
              className={cn(inputBase, "pl-9", emailError && "border-red-500 focus:border-red-500 focus:ring-red-500/15")}
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
        {emailError && <p className="text-xs text-red-600">{emailError}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#374151]">Verification code</label>
        <input
          ref={codeRef}
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="6-digit code"
          onInput={handleCodeInput}
          className={cn(inputBase, codeError && "border-red-500 focus:border-red-500 focus:ring-red-500/15")}
          disabled={!sent}
        />
        {codeError && <p className="text-xs text-red-600">{codeError}</p>}
        {!sent && !codeError && (
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

export default function UnifiedLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const role = params.get("role") || "candidate";

  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname === "localhost") {
      setIsManager(role !== "candidate");
    } else {
      setIsManager(hostname === "manager.kawaiimonkey.top");
    }
  }, [role]);

  const [tab, setTab] = useState<"password" | "otp">("password");

  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { title, subtitle } = useMemo(() => {
    if (isManager) return { title: "Management Portal", subtitle: "Sign in to access your workspace" };
    return { title: "Sign in to CATaur", subtitle: "Find your next opportunity" };
  }, [isManager]);

  const processSuccessfulLogin = (data: any, email: string) => {
    if (data.mfa_required) {
      throw new Error("MFA is required but not yet supported.");
    }

    if (data.access_token) {
      localStorage.setItem("authToken", data.access_token);
    }

    const actualRole = data.roles?.[0] || (isManager ? "Recruiter" : "Candidate");

    if (actualRole === "Candidate") {
      localStorage.setItem("candidateLoggedIn", "1");
      localStorage.setItem("candidateEmail", data.email || email);
      localStorage.setItem("candidateName", data.email ? data.email.split('@')[0] : "Candidate");
    } else if (actualRole === "Client") {
      localStorage.setItem("clientLoggedIn", "1");
    } else {
      const isAdmin = actualRole === "Admin";
      localStorage.setItem("userRole", isAdmin ? "admin" : "recruiter");
      localStorage.setItem("recruiterLoggedIn", "1");
    }

    toast.success("Login successful! Redirecting...");

    // Redirect logic: check params first, then role
    const defaultRedirect = actualRole === "Candidate" ? "/candidate" : (actualRole === "Client" ? "/client" : "/recruiter");
    const redirectUrl = defaultRedirect;

    setTimeout(() => {
      router.push(redirectUrl);
    }, 1000);
  };

  // ==========================================
  // [FRONTEND] Handle Standard Password Login
  // Purpose: Collects the email and password, sending them to the traditional login endpoint.
  // ==========================================
  const handlePasswordLogin = useCallback(
    async (email: string, pw: string) => {
      setIsPending(true);
      setErrorMsg(null);

      try {
        const data = await request("/auth/login/password", {
          method: "POST",
          json: { email, password: pw },
          skipDefaults: true
        });
        processSuccessfulLogin(data, email);
      } catch (err: any) {
        console.error("Login Error:", err);
        setErrorMsg(err.message || "Invalid email or password");
      } finally {
        setIsPending(false);
      }
    },
    [router, isManager]
  );

  // ==========================================
  // [FRONTEND] Submit OTP for Login
  // Purpose: Submits the email and the 6-digit code entered by the user to the backend for validation.
  // ==========================================
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
        processSuccessfulLogin(data, email);
      } catch (err: any) {
        console.error("OTP Login Error:", err);
        setErrorMsg(err.message || "Invalid verification code");
      } finally {
        setIsPending(false);
      }
    },
    [router, isManager]
  );

  // ==========================================
  // [FRONTEND] Handle Social Login (Google / GitHub)
  // Purpose: Triggers the Firebase authentication popup. Once the user authorizes, 
  // it retrieves the Firebase idToken and sends it to our NestJS backend for validation.
  // ==========================================
  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setIsPending(true);
    setErrorMsg(null);

    try {
      // 1. Select the appropriate Firebase provider based on user click
      const firebaseProvider = provider === 'google' ? googleProvider : githubProvider;
       // 2. Trigger the Firebase popup for OAuth authorization
      const result = await signInWithPopup(auth, firebaseProvider);
      // 3. Extract the secure idToken generated by Firebase
      const idToken = await result.user.getIdToken();

      // 4. Determine the correct backend endpoint
      const endpoint = provider === 'google' ? "/auth/login/google" : "/auth/login/github";
      // 5. Send the idToken to the NestJS backend to verify and exchange for a system JWT
      const data = await request(endpoint, {
        method: "POST",
        json: { idToken },
        skipDefaults: true
      });
      // 6. On success, process the returned user data and redirect
      processSuccessfulLogin(data, result.user.email || 'social-login');
    } catch (err: any) {
      console.error(`${provider} Login Error:`, err);
      setErrorMsg(err.message || `${provider} Login failed`);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-[0_4px_24px_-4px_rgba(12,24,55,0.12)]">
      {/* Header */}
      <div className="mb-7 text-center">
        <h1 className="text-xl font-bold text-[#111827]">{title}</h1>
        <p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
          {errorMsg}
        </div>
      )}

      <div className="space-y-5">
        {/* Social login ONLY for candidate */}
        {!isManager && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <SocialButton icon={<GoogleIcon />} label="Google" onClick={() => handleSocialLogin("google")} />
              <SocialButton icon={<GitHubIcon />} label="GitHub" onClick={() => handleSocialLogin("github")} />
            </div>
            <Divider label="or sign in with email" />
          </>
        )}

        {!isManager ? (
          <>
            {/* Tabs for Password vs OTP */}
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
              <PasswordForm onSubmit={handlePasswordLogin} isPending={isPending} isManager={isManager} />
            ) : (
              <OtpForm onSubmit={handleOtpLogin} isPending={isPending} onError={(msg) => setErrorMsg(msg)} />
            )}
          </>
        ) : (
          <PasswordForm onSubmit={handlePasswordLogin} isPending={isPending} isManager={isManager} />
        )}

        {/* Role switcher & Sign up links */}
        <div className="mt-5 space-y-2 text-center text-xs text-[#6B7280]">
          {!isManager ? (
            <>
              <p>
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-semibold text-[#1D4ED8] hover:underline underline-offset-2">
                  Create one
                </Link>
              </p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
