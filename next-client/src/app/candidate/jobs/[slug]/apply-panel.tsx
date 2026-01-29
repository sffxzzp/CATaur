"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, X } from "lucide-react";

type Props = {
  slug: string;
};

const STORAGE_KEY = "candidateAppliedJobs";

function getAppliedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function saveApplied(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // no-op for demo
  }
}

export default function ApplyPanel({ slug }: Props) {
  const [applied, setApplied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const set = getAppliedSet();
    setApplied(set.has(slug));
  }, [slug]);

  const onApply = () => {
    const set = getAppliedSet();
    if (!set.has(slug)) {
      set.add(slug);
      saveApplied(set);
    }
    setApplied(true);
    setShowModal(true);
  };

  return (
    <div className="p-0 text-foreground">
      <h3 className="text-lg font-semibold">Apply for this role</h3>
      <p className="mt-2 text-sm text-muted">
        Send your profile and resume to the recruiter. You can track your application in the Applications tab.
      </p>
      <div className="mt-5 space-y-2 text-sm text-muted">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          Attach resume/CV (PDF or profile link)
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          Answer 2–3 short screening questions
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          Typical response time: 3–5 business days
        </div>
      </div>
      <Button className="mt-6 w-full justify-center" size="sm" onClick={onApply} disabled={applied}>
        {applied ? (
          <>Applied</>
        ) : (
          <>
            Apply now
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <h4 className="text-base font-semibold text-foreground">Application submitted</h4>
                  <p className="text-sm text-muted">We’ve sent your application to the recruiter.</p>
                </div>
              </div>
              <button
                className="rounded-md p-1 text-muted hover:bg-slate-100"
                aria-label="Close"
                onClick={() => setShowModal(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                Close
              </Button>
              <Button size="sm" asChild>
                <Link href="/candidate/applications">View applications</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

