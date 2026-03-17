"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Clock, MapPin, Building2, CalendarClock, ChevronRight, Inbox, CheckCircle2, Loader2 } from "lucide-react";
import { GuestGate } from "@/components/candidate/guest-gate";
import { request } from "@/lib/request";

// ─── Status mapping ───────────────────────────────────────────────────────────
type RecruiterStatus = "New" | "Interview" | "Offer" | "Closed";

const STATUS_DISPLAY: Record<RecruiterStatus, { label: string; classes: string }> = {
  New: {
    label: "Application Received",
    classes: "bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]",
  },
  Interview: {
    label: "Interview Scheduled",
    classes: "bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]",
  },
  Offer: {
    label: "Offer Received",
    classes: "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]",
  },
  Closed: {
    label: "Position Filled",
    classes: "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]",
  },
};

// ─── Application interface ────────────────────────────────────────────────────
interface Application {
  id: string | number;
  jobSlug: string;
  role: string;
  company: string;
  location: string;
  appliedDate: string;
  recruiterStatus: RecruiterStatus;
  interview?: {
    recruiterName: string;
    date: string;
    time: string;
    format: string;
    type: string;
    message: string;
  };
}

// ─── Mock fallback ────────────────────────────────────────────────────────────
const MOCK_APPLICATIONS: Application[] = [
  {
    id: 1,
    jobSlug: "senior-backend-engineer-neptune",
    role: "Senior Backend Engineer",
    company: "Neptune Pay",
    location: "Toronto, ON, Canada",
    appliedDate: "Feb 25, 2025",
    recruiterStatus: "Interview",
    interview: {
      recruiterName: "Sarah Chen",
      date: "Thu, Mar 6",
      time: "2:30 PM EST",
      format: "Zoom",
      type: "Technical Interview",
      message:
        "Hi, thank you for applying to Neptune Pay! We were impressed with your background and would like to invite you to a Technical Interview.\n\nPlease join us via Zoom at the time listed below. The session will be approximately 60 minutes and will include a system design discussion and a live coding exercise.\n\nPlease confirm your availability by replying to this message or via email. Looking forward to speaking with you!",
    },
  },
  {
    id: 2,
    jobSlug: "frontend-engineer-eurora",
    role: "Frontend Engineer",
    company: "Aurora Cloud Platform",
    location: "Toronto, ON, Canada",
    appliedDate: "Feb 24, 2025",
    recruiterStatus: "New",
  },
  {
    id: 3,
    jobSlug: "devops-sre-atlas",
    role: "DevOps / SRE",
    company: "Atlas Ventures",
    location: "Vancouver, BC, Canada",
    appliedDate: "Feb 22, 2025",
    recruiterStatus: "Offer",
  },
  {
    id: 4,
    jobSlug: "data-engineer-nova",
    role: "Data Engineer",
    company: "Polar Analytics",
    location: "Montreal, QC, Canada",
    appliedDate: "Feb 18, 2025",
    recruiterStatus: "Closed",
  },
];

/** Map a backend Application entity to the frontend Application shape */
function mapApiApplication(item: any): Application {
  // Map backend status to frontend RecruiterStatus
  let recruiterStatus: RecruiterStatus = "New";
  const status = (item.status || "").toLowerCase();
  if (status === "interview" || status === "screening") recruiterStatus = "Interview";
  else if (status === "offer" || status === "offered") recruiterStatus = "Offer";
  else if (status === "closed" || status === "rejected" || status === "withdrawn" || status === "hired") recruiterStatus = "Closed";
  else recruiterStatus = "New";

  return {
    id: item.id,
    jobSlug: item.jobOrderId || item.jobOrder?.id || "",
    role: item.jobOrder?.title || "Unknown Position",
    company: item.jobOrder?.company?.name || "Unknown Company",
    location: item.jobOrder?.location || "Location TBD",
    appliedDate: item.createdAt
      ? new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "Recently",
    recruiterStatus,
  };
}

// ─── Application card ─────────────────────────────────────────────────────────

function ApplicationCard({ app }: { app: Application }) {
  const status = STATUS_DISPLAY[app.recruiterStatus];
  const storageKey = `interviewConfirmed_${app.id}`;
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    setConfirmed(localStorage.getItem(storageKey) === "1");
  }, [storageKey]);

  const handleConfirm = () => {
    localStorage.setItem(storageKey, "1");
    setConfirmed(true);
  };

  const isClosed = app.recruiterStatus === "Closed";

  return (
    <div
      className={`overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-sm ${isClosed ? "border-[#E5E7EB] opacity-60" : "border-[#E5E7EB]"
        }`}
    >
      {/* Main row */}
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        {/* Left: job info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-medium text-[#111827] truncate">{app.role}</h2>
            <span
              className={`inline-flex shrink-0 items-center rounded px-2 py-0.5 text-xs font-medium border ${status.classes}`}
            >
              {status.label}
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#6B7280]">
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {app.company}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {app.location}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Applied {app.appliedDate}
            </span>
          </div>
        </div>

        {/* Right: view job link */}
        <Link
          href={`/candidate/jobs/${app.jobSlug}`}
          className="flex shrink-0 items-center gap-1 rounded border border-[#D1D5DB] bg-[#F9FAFB] px-3 py-1.5 text-sm font-medium text-[#374151] transition hover:border-[#1D4ED8] hover:text-[#1D4ED8]"
        >
          View Job
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Interview block */}
      {app.recruiterStatus === "Interview" && app.interview && (
        <div className="border-t border-[#E5E7EB]">
          {/* Message header */}
          <div className="flex items-center justify-between border-b border-[#E5E7EB] bg-[#FFFBEB] px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FDE68A] text-xs font-bold text-[#92400E]">
                {app.interview.recruiterName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111827]">
                  {app.interview.recruiterName} · Recruiter at {app.company}
                </p>
                <p className="text-sm text-muted-foreground">
                  Interview Invitation · {app.interview.type}
                </p>
              </div>
            </div>
            {/* Interview meta */}
            <div className="flex items-center gap-1.5 rounded border border-[#FDE68A] bg-white px-3 py-1.5 text-sm font-medium text-[#92400E]">
              <CalendarClock className="h-3 w-3" />
              {app.interview.date} · {app.interview.time} · {app.interview.format}
            </div>
          </div>

          {/* Message body */}
          <div className="bg-white px-5 py-4">
            {app.interview.message.split("\n\n").map((para, i) => (
              <p key={i} className={`text-base text-[#374151] leading-relaxed ${i > 0 ? "mt-3" : ""}`}>
                {para}
              </p>
            ))}
          </div>

          {/* Confirm footer */}
          <div className="flex items-center justify-end border-t border-[#E5E7EB] bg-[#F9FAFB] px-5 py-3">
            {confirmed ? (
              <span className="flex items-center gap-1.5 text-base font-medium text-[#166534]">
                <CheckCircle2 className="h-4 w-4" />
                Interview Confirmed
              </span>
            ) : (
              <button
                onClick={handleConfirm}
                className="flex items-center gap-1.5 rounded border border-[#1D4ED8] bg-[#1D4ED8] px-4 py-1.5 text-base font-medium text-white transition hover:bg-[#1E40AF]"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirm Interview
              </button>
            )}
          </div>
        </div>
      )}

      {/* Offer strip */}
      {app.recruiterStatus === "Offer" && (
        <div className="flex items-center gap-3 border-t border-[#BBF7D0] bg-[#F0FDF4] px-5 py-3">
          <CheckCircle2 className="h-4 w-4 text-[#166534]" />
          <p className="text-base font-medium text-[#166534]">
            You&apos;ve received an offer! The recruiter will be in touch with next steps.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-[#D1D5DB] bg-white py-16 text-center">
      <Inbox className="h-8 w-8 text-[#D1D5DB]" />
      <div>
        <p className="text-lg font-medium text-[#111827]">No applications yet</p>
        <p className="mt-1 text-base text-muted-foreground">
          Start applying to jobs and your applications will appear here.
        </p>
      </div>
      <Link
        href="/candidate/jobs"
        className="mt-2 rounded border border-[#1D4ED8] bg-[#1D4ED8] px-4 py-2 text-base font-medium text-white transition hover:bg-[#1E40AF]"
      >
        Browse Jobs
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await request("/candidate/applications?page=1&limit=100");
        const result = res as any;
        if (result?.data && Array.isArray(result.data) && result.data.length > 0) {
          setApplications(result.data.map(mapApiApplication));
        } else {
          setApplications([]);
        }
      } catch (err: any) {
        console.error("Failed to load applications", err);
        setError(err?.message || "Failed to load applications");
        setApplications([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchApplications();
  }, []);

  return (
    <GuestGate>
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#111827]">My Applications</h1>
          <p className="mt-1 text-base text-muted-foreground">
            Track the status of your submitted applications.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            <strong>Error:</strong> {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#1D4ED8]" />
          </div>
        ) : !error && applications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <ApplicationCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </div>
    </GuestGate>
  );
}
