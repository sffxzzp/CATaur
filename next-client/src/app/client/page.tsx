"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { request } from "@/lib/request";
import {
  ArrowRight,
  Briefcase,
  Users,
  CalendarClock,
  BadgeDollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  AlertTriangle,
  ChevronRight,
  Loader2,
} from "lucide-react";

/* ─── helpers ────────────────────────────────────────────────────────────── */
function initials(name: string) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
}

/* ─── Status configs ─────────────────────────────────────────────────────── */
const CANDIDATE_STATUS: Record<string, { label: string; bg: string; text: string }> = {
  new: { label: "New", bg: "bg-[var(--status-blue-bg)]", text: "text-[var(--status-blue-text)]" },
  interview: { label: "Interview", bg: "bg-[var(--status-amber-bg)]", text: "text-[var(--status-amber-text)]" },
  offer: { label: "Offer", bg: "bg-[var(--status-green-bg)]", text: "text-[var(--status-green-text)]" },
  closed: { label: "Closed", bg: "bg-[var(--gray-100)]", text: "text-[var(--gray-500)]" },
};

const JOB_STATUS: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: "Active", bg: "bg-[var(--status-green-bg)]", text: "text-[var(--status-green-text)]" },
  onhold: { label: "On Hold", bg: "bg-[var(--status-amber-bg)]", text: "text-[var(--status-amber-text)]" },
  closed: { label: "Closed", bg: "bg-[var(--gray-100)]", text: "text-[var(--gray-500)]" },
  // recruiter statuses mapped visually
  sourcing: { label: "Active", bg: "bg-[var(--status-green-bg)]", text: "text-[var(--status-green-text)]" },
  interview: { label: "Active", bg: "bg-[var(--status-green-bg)]", text: "text-[var(--status-green-text)]" },
  offer: { label: "Active", bg: "bg-[var(--status-green-bg)]", text: "text-[var(--status-green-text)]" },
  paused: { label: "On Hold", bg: "bg-[var(--status-amber-bg)]", text: "text-[var(--status-amber-text)]" },
  filled: { label: "Closed", bg: "bg-[var(--gray-100)]", text: "text-[var(--gray-500)]" },
};

type DashboardResponse = {
  activeOrders: number;
  totalCandidates: number;
  pendingDecisions: number;
  offersInProgress: number;
  recentCandidates: {
    id: string;
    jobOrder: { title: string };
    candidate: { nickname: string };
    status: string;
    clientDecisionType: string | null;
  }[];
  myDecisions: { decision: string; count: number }[];
  myJobOrders: {
    id: string;
    title: string;
    status: string;
    locationCity: string | null;
    locationState: string | null;
    locationCountry: string | null;
    candidateCount: number;
  }[];
};

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function ClientDashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    request<DashboardResponse>("/client/dashboard")
      .then(setData)
      .catch((err) => {
        toast.error(err.message || "Failed to load dashboard data overview.");
        setError("Failed to load dashboard data overview.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-2 text-[var(--gray-400)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="rounded-md bg-red-50 p-4 text-red-600 border border-red-200">
          {error || "No data could be loaded."}
        </div>
      </div>
    );
  }

  const {
    activeOrders,
    totalCandidates,
    pendingDecisions,
    offersInProgress,
    recentCandidates,
    myDecisions,
    myJobOrders,
  } = data;

  const decisionSummary = {
    total: myDecisions.reduce((a, b) => a + b.count, 0),
    requestOffer: myDecisions.find(d => d.decision === 'request-offer')?.count || 0,
    pass: myDecisions.find(d => d.decision === 'pass')?.count || 0,
    hold: myDecisions.find(d => d.decision === 'hold')?.count || 0,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--gray-900)]">Welcome back, Client Contact</h2>
        <p className="mt-0.5 text-sm text-[var(--gray-500)]">
          Here&apos;s what&apos;s happening with your hiring pipeline today.
        </p>
      </div>

      {/* ── Pending Decisions banner ───────────────────────────────────────── */}
      {pendingDecisions > 0 && (
        <Link
          href="/client/decisions"
          className="flex items-center justify-between gap-4 rounded-lg border border-[var(--status-amber-text)]/25 bg-[var(--status-amber-bg)] px-5 py-4 transition hover:brightness-[0.97]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--status-amber-text)]/15">
              <AlertTriangle className="h-4 w-4 text-[var(--status-amber-text)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--status-amber-text)]">
                {pendingDecisions} candidate{pendingDecisions > 1 ? "s" : ""} awaiting your decision
              </p>
              <p className="text-xs text-[var(--status-amber-text)]/75 mt-0.5">
                These candidates have completed their interviews — tell us who you&apos;d like to move forward with.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 text-xs font-semibold text-[var(--status-amber-text)]">
            Go to Decisions <ChevronRight className="h-4 w-4" />
          </div>
        </Link>
      )}

      {/* ── 4 Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {/* Active Job Orders */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--status-blue-bg)]">
            <Briefcase className="h-4 w-4 text-[var(--status-blue-text)]" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-[var(--gray-900)] tracking-tight">{activeOrders}</p>
            <p className="mt-0.5 text-xs text-[var(--gray-500)]">Active Job Orders</p>
          </div>
        </div>
        {/* Total Candidates */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--gray-100)]">
            <Users className="h-4 w-4 text-[var(--gray-500)]" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-[var(--gray-900)] tracking-tight">{totalCandidates}</p>
            <p className="mt-0.5 text-xs text-[var(--gray-500)]">Total Candidates</p>
          </div>
        </div>
        {/* Awaiting Decision */}
        <div className={`rounded-lg border bg-[var(--surface)] p-5 ${pendingDecisions > 0 ? "border-[var(--status-amber-text)]/30" : "border-[var(--border)]"}`}>
          <div className={`flex h-9 w-9 items-center justify-center rounded-md ${pendingDecisions > 0 ? "bg-[var(--status-amber-bg)]" : "bg-[var(--gray-100)]"}`}>
            <CalendarClock className={`h-4 w-4 ${pendingDecisions > 0 ? "text-[var(--status-amber-text)]" : "text-[var(--gray-400)]"}`} />
          </div>
          <div className="mt-4">
            <p className={`text-2xl font-bold tracking-tight ${pendingDecisions > 0 ? "text-[var(--status-amber-text)]" : "text-[var(--gray-900)]"}`}>
              {pendingDecisions}
            </p>
            <p className="mt-0.5 text-xs text-[var(--gray-500)]">Awaiting Your Decision</p>
          </div>
        </div>
        {/* Offers in Progress */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--status-green-bg)]">
            <BadgeDollarSign className="h-4 w-4 text-[var(--status-green-text)]" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-[var(--gray-900)] tracking-tight">{offersInProgress}</p>
            <p className="mt-0.5 text-xs text-[var(--gray-500)]">Offers in Progress</p>
          </div>
        </div>
      </div>

      {/* ── Main two-column grid ───────────────────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-3">

        {/* ── Recent Candidates (2/3 width) ─────────────────────────────── */}
        <div className="xl:col-span-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between border-b border-[var(--border-light)] px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--gray-900)]">Recent Candidates</h3>
              <p className="text-xs text-[var(--gray-500)] mt-0.5">Latest submitted for your positions</p>
            </div>
            <Link
              href="/client/applications"
              className="flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-[var(--border-light)]">
            {recentCandidates.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--gray-500)]">No recent candidates to display.</div>
            ) : (
              recentCandidates.map((c) => {
                const sc = CANDIDATE_STATUS[c.status] || CANDIDATE_STATUS.new;
                const candName = c.candidate?.nickname || "Unknown Candidate";
                const jobTitle = c.jobOrder?.title || "Unknown Job";

                return (
                  <Link
                    key={c.id}
                    href={`/client/applications/${encodeURIComponent(c.id)}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--gray-50)] transition-colors"
                  >
                    {/* Avatar */}
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold
                        ${c.status === "interview" ? "bg-[var(--status-amber-bg)] text-[var(--status-amber-text)]"
                        : c.status === "offer" ? "bg-[var(--status-green-bg)] text-[var(--status-green-text)]"
                          : "bg-[var(--gray-200)] text-[var(--gray-600)]"}`}>
                      {initials(candName)}
                    </div>
                    {/* Name + role */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--gray-900)] truncate">{candName}</p>
                      <p className="text-xs text-[var(--gray-400)] truncate">{jobTitle}</p>
                    </div>
                    {/* Status */}
                    <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${sc.bg} ${sc.text}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {sc.label}
                    </span>
                    {/* Decision needed indicator */}
                    {c.status === "interview" && !c.clientDecisionType && (
                      <span className="shrink-0 text-[10px] font-semibold text-[var(--status-amber-text)] bg-[var(--status-amber-bg)] rounded px-1.5 py-0.5">
                        Decide
                      </span>
                    )}
                    {c.status === "interview" && c.clientDecisionType && (
                      <span className="shrink-0 text-[10px] font-semibold text-[var(--status-green-text)] bg-[var(--status-green-bg)] rounded px-1.5 py-0.5">
                        ✓ Done
                      </span>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right column: Decisions Summary + My Job Orders ───────────── */}
        <div className="flex flex-col gap-4">

          {/* Decisions Summary */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border-light)] px-5 py-4">
              <h3 className="text-sm font-semibold text-[var(--gray-900)]">My Decisions</h3>
              <Link href="/client/decisions" className="flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="p-5 space-y-3">
              {decisionSummary.total === 0 ? (
                <p className="text-xs text-[var(--gray-400)] text-center py-2">No decisions submitted yet.</p>
              ) : (
                <>
                  {/* Offer Requested */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--status-green-bg)]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[var(--status-green-text)]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-[var(--gray-600)]">Request Offer</span>
                        <span className="text-xs font-semibold text-[var(--gray-900)]">{decisionSummary.requestOffer}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[var(--gray-100)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--status-green-text)]"
                          style={{ width: `${decisionSummary.total > 0 ? (decisionSummary.requestOffer / decisionSummary.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Pass */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--danger-bg)]">
                      <XCircle className="h-3.5 w-3.5 text-[var(--status-red-text)]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-[var(--gray-600)]">Pass</span>
                        <span className="text-xs font-semibold text-[var(--gray-900)]">{decisionSummary.pass}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[var(--gray-100)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--status-red-text)]"
                          style={{ width: `${decisionSummary.total > 0 ? (decisionSummary.pass / decisionSummary.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Hold */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--status-amber-bg)]">
                      <Clock className="h-3.5 w-3.5 text-[var(--status-amber-text)]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-[var(--gray-600)]">Hold</span>
                        <span className="text-xs font-semibold text-[var(--gray-900)]">{decisionSummary.hold}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[var(--gray-100)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--status-amber-text)]"
                          style={{ width: `${decisionSummary.total > 0 ? (decisionSummary.hold / decisionSummary.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* My Job Orders */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--border-light)] px-5 py-4">
              <h3 className="text-sm font-semibold text-[var(--gray-900)]">My Job Orders</h3>
              <Link href="/client/orders" className="flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-[var(--border-light)] flex-1">
              {myJobOrders.length === 0 ? (
                <div className="p-8 text-center text-sm text-[var(--gray-500)]">No recent jobs available.</div>
              ) : (
                myJobOrders.slice(0, 5).map((job) => {
                  const sc = JOB_STATUS[job.status] ?? JOB_STATUS.active;
                  const locationLabel = [job.locationCity, job.locationState, job.locationCountry].filter(Boolean).join(", ") || "Unspecified Location";
                  return (
                    <Link
                      key={job.id}
                      href={`/client/orders/${encodeURIComponent(job.id)}`}
                      className="flex items-start gap-3 px-5 py-3 hover:bg-[var(--gray-50)] transition-colors"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--gray-100)] mt-0.5">
                        <Briefcase className="h-3.5 w-3.5 text-[var(--gray-500)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--gray-900)] truncate leading-tight">{job.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <MapPin className="h-3 w-3 text-[var(--gray-400)] shrink-0" />
                          <span className="text-xs text-[var(--gray-400)] truncate">{locationLabel}</span>
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${sc.bg} ${sc.text}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {sc.label}
                        </span>
                        <span className="text-[11px] text-[var(--gray-400)]">
                          {job.candidateCount} candidate{job.candidateCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
