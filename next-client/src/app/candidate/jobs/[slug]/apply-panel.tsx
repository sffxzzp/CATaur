"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, ArrowRight, FileText, X, Loader2 } from "lucide-react";
import { useCandidateAuth, LoginToApplyModal } from "@/components/candidate/guest-gate";
import { request } from "@/lib/request";

type Props = { slug: string; jobId: string; jobTitle?: string; company?: string };

const STORAGE_KEY = "candidateAppliedJobs";

function getAppliedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveApplied(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch { }
}

// ─── Success Modal ────────────────────────────────────────────────────────────
function SuccessModal({
  jobTitle,
  company,
  onClose,
}: {
  jobTitle?: string;
  company?: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#111827]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="border-b border-[#E5E7EB] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#F0FDF4]">
              <CheckCircle2 className="h-5 w-5 text-[#166534]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111827]">Application Submitted</p>
              <p className="text-xs text-[#6B7280]">
                {jobTitle && company
                  ? `${jobTitle} at ${company}`
                  : "Your application has been sent."}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-[#374151]">
            The recruiter will review your profile and reach out if there&apos;s a match.
            You can track the status of your application in real time.
          </p>

          {/* What's next */}
          <div className="mt-4 rounded border border-[#E5E7EB] bg-[#F9FAFB] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              What happens next
            </p>
            <ol className="space-y-2">
              {[
                "Your profile has been sent to the recruiter",
                "The recruiter will review and follow up if there's a match",
                "Track your application status in the Applications tab",
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-[#374151]">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-xs font-bold text-[#1D4ED8]">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-col gap-2">
            <Button variant="primary" size="md" className="w-full" asChild>
              <Link href="/candidate/applications" className="flex items-center justify-center gap-2">
                View My Applications
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="md" className="w-full" onClick={onClose}>
              Browse More Jobs
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Apply Panel ──────────────────────────────────────────────────────────────
export default function ApplyPanel({ slug, jobId, jobTitle, company }: Props) {
  const loggedIn = useCandidateAuth();
  const isGuest = loggedIn !== true;

  const [applied, setApplied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkApplied = async () => {
      if (isGuest) {
        setApplied(getAppliedSet().has(slug));
        return;
      }

      try {
        const res = await request("/candidate/applications?page=1&limit=1000");
        const result = res as any;
        if (result?.data && Array.isArray(result.data)) {
          const hasApplied = result.data.some((app: any) => app.jobOrderId === jobId);
          setApplied(hasApplied);
        } else {
          setApplied(getAppliedSet().has(slug));
        }
      } catch {
        setApplied(getAppliedSet().has(slug));
      }
    };

    checkApplied();
  }, [slug, jobId, isGuest]);

  const handleApply = async () => {
    if (isGuest) {
      setShowLoginModal(true);
      return;
    }

    setIsApplying(true);
    setApplyError(null);

    try {
      // Call backend API to submit application
      await request(`/candidate/jobs/${jobId}/apply`, { method: "POST" });

      // Mark as applied in localStorage as well
      const set = getAppliedSet();
      set.add(slug);
      saveApplied(set);
      setApplied(true);
      setShowModal(true);
    } catch (err: any) {
      // If already applied or other error
      const msg = err?.message || "Failed to submit application";
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("duplicate")) {
        // Already applied — mark it anyway
        const set = getAppliedSet();
        set.add(slug);
        saveApplied(set);
        setApplied(true);
      } else {
        setApplyError(msg);
      }
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <>
      {showModal && (
        <SuccessModal
          jobTitle={jobTitle}
          company={company}
          onClose={() => setShowModal(false)}
        />
      )}

      {showLoginModal && (
        <LoginToApplyModal
          jobTitle={jobTitle ?? "this position"}
          onClose={() => setShowLoginModal(false)}
        />
      )}

      {applied ? (
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#F0FDF4]">
            <CheckCircle2 className="h-5 w-5 text-[#166534]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#111827]">Application Submitted</p>
            <p className="mt-1 text-xs text-[#6B7280]">
              Your profile has been sent to the recruiter.
            </p>
          </div>
          <Button variant="primary" size="sm" className="w-full" asChild>
            <Link href="/candidate/applications" className="flex items-center justify-center gap-2">
              View My Applications
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Link
            href="/candidate/jobs"
            className="text-xs text-[#1D4ED8] underline-offset-2 hover:underline transition"
          >
            Browse more jobs
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-[#111827]">Ready to apply?</p>
            <p className="mt-1 text-xs text-[#6B7280]">
              {isGuest
                ? "Sign in to submit your application."
                : "Your saved profile and resume will be attached automatically."}
            </p>
          </div>
          {!isGuest && (
            <div className="flex items-start gap-2 rounded border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-xs text-[#374151]">
              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6B7280]" />
              <span>Your profile &amp; resume will be attached to this application.</span>
            </div>
          )}
          {applyError && (
            <div className="rounded-md bg-red-50 p-3 text-xs text-red-600 font-medium">
              {applyError}
            </div>
          )}
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={handleApply}
            disabled={isApplying}
          >
            {isApplying ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
            ) : (
              <>{isGuest ? "Sign In to Apply" : "Submit Application"}<ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </div>
      )}
    </>
  );
}
