/* Shared hook + GuestGate component for candidate guest-mode support */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";

/** Returns true when the candidate is logged in, false when guest, null while loading. */
export function useCandidateAuth(): boolean | null {
    const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const check = () =>
            setLoggedIn(localStorage.getItem("candidateLoggedIn") === "1");
        check();
        const onStorage = (e: StorageEvent) => {
            if (e.key === "candidateLoggedIn") check();
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    return loggedIn;
}

/**
 * Wrap any protected page content with this.
 * Guests see a friendly "login required" screen instead of the real content.
 */
export function GuestGate({ children }: { children: React.ReactNode }) {
    const loggedIn = useCandidateAuth();

    // While loading (SSR / hydration), render nothing to avoid flicker
    if (loggedIn === null) return null;

    if (!loggedIn) {
        const redirect = encodeURIComponent(
            typeof window !== "undefined" ? window.location.pathname : "/candidate"
        );
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-light)]">
                    <Lock className="h-6 w-6 text-[var(--accent)]" />
                </div>
                <h2 className="text-2xl font-semibold text-[var(--gray-900)]">
                    Login Required
                </h2>
                <p className="mt-2 max-w-sm text-base text-muted-foreground">
                    You need to be signed in to access this page.
                </p>
                <Link
                    href={"/login"}
                    className="mt-6 inline-flex items-center gap-2 rounded bg-[var(--accent)] px-5 py-2.5 text-base font-semibold text-white transition hover:bg-[var(--accent-hover)]"
                >
                    Sign in to continue
                </Link>
                <p className="mt-3 text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-[var(--accent)] hover:underline">
                        Create one for free
                    </Link>
                </p>
            </div>
        );
    }

    return <>{children}</>;
}

/**
 * Small modal that appears when a guest tries to apply for a job.
 */
export function LoginToApplyModal({
    jobTitle,
    onClose,
}: {
    jobTitle: string;
    onClose: () => void;
}) {
    const redirect = encodeURIComponent(
        typeof window !== "undefined" ? window.location.href : "/candidate/jobs"
    );

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-modal)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="border-b border-[var(--border)] px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-light)]">
                            <Lock className="h-4 w-4 text-[var(--accent)]" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-[var(--gray-900)]">
                                Sign in to Apply
                            </h3>
                            <p className="text-sm text-muted-foreground">{jobTitle}</p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 text-base text-[var(--gray-600)]">
                    Create a free account or sign in to submit your application and track
                    its status.
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] bg-[var(--gray-50)] px-6 py-4">
                    <button
                        onClick={onClose}
                        className="rounded border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-base text-[var(--gray-600)] transition hover:bg-[var(--gray-100)]"
                    >
                        Cancel
                    </button>
                    <Link
                        href={`/register`}
                        className="rounded border border-transparent bg-[var(--surface)] px-4 py-2 text-base text-[var(--accent)] ring-1 ring-[var(--accent)] transition hover:bg-[var(--accent-light)]"
                    >
                        Create Account
                    </Link>
                    <Link
                        href={"/login"}
                        className="rounded bg-[var(--accent)] px-4 py-2 text-base font-semibold text-white transition hover:bg-[var(--accent-hover)]"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
