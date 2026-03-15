"use client";

import { useMemo, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { request } from "@/lib/request";
import { CANDIDATE_RECORDS } from "@/data/recruiter";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Users,
  UserCheck,
  DollarSign,
  AlignLeft,
  Loader2,
  Clock,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

/* ── Types ───────────────────────────────────────────────────────────────── */
type APIJobOrder = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  location: string;
  openings: number;
  salary: string;
  tags: string[];
  companyId: string;
  company?: {
    id: string;
    name: string;
    contact: string;
    website: string;
    keyTechnologies: string;
  };
  assignedToId: string;
  assignedTo?: {
    id: string;
    email: string;
    nickname: string;
  };
  createdAt: string;
  updatedAt: string;
  applicants?: number;
};

/* ── Status helpers ──────────────────────────────────────────────────────── */

function getStatusGroup(status: string) {
  const s = status.toLowerCase();
  if (s === "filled" || s === "closed") return "closed";
  if (s === "paused" || s === "onhold") return "onhold";
  return "active";
}

const STATUS_STYLE: Record<
  "active" | "onhold" | "closed",
  { bg: string; text: string; dot: string; label: string }
> = {
  active: {
    bg: "bg-[var(--status-green-bg)]",
    text: "text-[var(--status-green-text)]",
    dot: "bg-[var(--status-green-text)]",
    label: "Active",
  },
  onhold: {
    bg: "bg-[var(--gray-100)]",
    text: "text-[var(--gray-600)]",
    dot: "bg-[var(--gray-400)]",
    label: "On Hold",
  },
  closed: {
    bg: "bg-[var(--gray-100)]",
    text: "text-[var(--gray-600)]",
    dot: "bg-[var(--gray-400)]",
    label: "Closed",
  },
};

const CAND_STAGE_STYLE: Record<string, { bg: string; text: string }> = {
  new: { bg: "bg-[var(--gray-100)]", text: "text-[var(--gray-600)]" },
  interview: { bg: "bg-[var(--status-blue-bg)]", text: "text-[var(--status-blue-text)]" },
  offer: { bg: "bg-[var(--status-amber-bg)]", text: "text-[var(--status-amber-text)]" },
  closed: { bg: "bg-[var(--status-red-bg)]", text: "text-[var(--status-red-text)]" },
};

const STAGE_LABEL: Record<string, string> = {
  new: "Submitted",
  interview: "Interview",
  offer: "Offer",
  closed: "Closed",
};

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function ClientOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);

  const [job, setJob] = useState<APIJobOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    request<APIJobOrder>(`/client/orders/${id}`)
      .then((res) => {
        setJob(res);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || "Job order not found or an error occurred.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const candidates = useMemo(
    () => CANDIDATE_RECORDS.filter((c) => c.jobId === id),
    [id]
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-2 text-[var(--gray-400)]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm font-medium">Loading position details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-[var(--danger)] bg-[var(--danger-bg)] p-6 text-sm text-[var(--danger)]">
          {error || "Job order not found."}
        </div>
      </div>
    );
  }

  const safeStatus = job?.status || "active";
  const group = getStatusGroup(safeStatus);
  const sc = STATUS_STYLE[group] || STATUS_STYLE.active;

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Back */}
      <Link
        href="/client/orders"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--gray-500)] hover:text-[var(--accent)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Job Orders
      </Link>

      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-[var(--gray-900)] tracking-tight">{job?.title || "Untitled Position"}</h2>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.bg} ${sc.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
              {sc.label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--gray-500)]">
            {job?.company?.name && (
              <span className="flex items-center gap-1.5 font-medium text-[var(--gray-700)]">
                <Briefcase className="h-4 w-4" />{job.company.name}
              </span>
            )}
            {job?.location && (
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{job.location}</span>
            )}
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{job?.openings ?? 0} opening{(job?.openings ?? 0) !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Pipeline + Candidates */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <div className="border-b border-[var(--border-light)] px-5 py-4 flex items-center gap-2">
              <AlignLeft className="h-4 w-4 text-[var(--gray-500)]" />
              <h3 className="text-sm font-semibold text-[var(--gray-900)]">Description</h3>
            </div>
            <div className="p-6 text-sm text-[var(--gray-700)]">
              {job?.description ? (
                <div className="prose prose-sm max-w-none text-[var(--gray-700)] [&>h3]:text-[var(--gray-900)] [&>h3]:font-semibold [&>h3]:mt-6 [&>h3:first-child]:mt-0 [&>h3]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1 [&>ul]:mb-4 [&>p]:mb-4 [&>p:last-child]:mb-0 [&_strong]:text-[var(--gray-900)] [&_strong]:font-semibold">
                  <ReactMarkdown>{job.description}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-[var(--gray-500)]">No description provided for this position.</p>
              )}
            </div>
            {job?.updatedAt && (
              <div className="border-t border-[var(--border-light)] flex items-center gap-2 px-5 py-3 text-xs text-[var(--gray-400)]">
                <Clock className="h-3.5 w-3.5" />
                Last updated {new Date(job.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            )}
          </div>

          {/* Submitted Candidates */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center justify-between border-b border-[var(--border-light)] px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--gray-900)]">Submitted Candidates</h3>
                <p className="text-xs text-[var(--gray-500)] mt-0.5">
                  {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} for this position
                </p>
              </div>
              <Link href="/client/candidates" className="text-xs font-medium text-[var(--accent)] hover:underline">
                View all →
              </Link>
            </div>

            {candidates.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 py-10">
                <UserCheck className="h-8 w-8 text-[var(--gray-300)]" />
                <p className="text-sm text-[var(--gray-500)]">No candidates submitted for this position yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-light)]">
                {candidates.map((c) => {
                  const cs = CAND_STAGE_STYLE[c.status] ?? CAND_STAGE_STYLE.new;
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-[var(--gray-50)] transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--gray-900)] truncate">{c.name}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[var(--gray-500)]">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {c.location}
                          </span>
                          <span>Available: {c.availability}</span>
                          <span>Applied: {c.appliedAt}</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cs.bg} ${cs.text}`}>
                          {STAGE_LABEL[c.status] ?? c.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Job Details */}
        <div className="space-y-5">
          {/* Job Details Card */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <div className="border-b border-[var(--border-light)] px-5 py-4">
              <h3 className="text-sm font-semibold text-[var(--gray-900)]">Position Details</h3>
            </div>
            <dl className="divide-y divide-[var(--border-light)] text-sm">
              <div className="flex items-center justify-between px-5 py-3">
                <dt className="flex items-center gap-2 text-[var(--gray-500)]">
                  <Briefcase className="h-3.5 w-3.5" /> Priority
                </dt>
                <dd className="font-medium text-[var(--gray-900)] capitalize">{job?.priority || "Normal"}</dd>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <dt className="flex items-center gap-2 text-[var(--gray-500)]">
                  <Users className="h-3.5 w-3.5" /> Openings
                </dt>
                <dd className="font-medium text-[var(--gray-900)]">{job?.openings ?? 0}</dd>
              </div>

              {job?.salary && (
                <div className="flex items-center justify-between px-5 py-3">
                  <dt className="flex items-center gap-2 text-[var(--gray-500)]">
                    <DollarSign className="h-3.5 w-3.5" /> Salary
                  </dt>
                  <dd className="font-medium text-[var(--gray-900)]">{job.salary}</dd>
                </div>
              )}
              {job?.assignedTo?.nickname && (
                <div className="flex items-center justify-between px-5 py-3">
                  <dt className="flex items-center gap-2 text-[var(--gray-500)]">
                    <UserCheck className="h-3.5 w-3.5" /> Recruiter
                  </dt>
                  <dd className="font-medium text-[var(--gray-900)]">{job.assignedTo.nickname}</dd>
                </div>
              )}
              <div className="flex items-center justify-between px-5 py-3">
                <dt className="flex items-center gap-2 text-[var(--gray-500)]">
                  <Users className="h-3.5 w-3.5" /> Submitted
                </dt>
                <dd className="font-medium text-[var(--gray-900)]">{job?.applicants ?? candidates.length}</dd>
              </div>
            </dl>
          </div>

          {/* Tags */}
          {job?.tags && job.tags.length > 0 && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
              <h3 className="text-sm font-semibold text-[var(--gray-900)] mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {(job.tags || []).map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-[var(--border)] bg-[var(--gray-50)] px-2.5 py-1 text-xs font-medium text-[var(--gray-700)]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Candidates summary */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
            <h3 className="text-sm font-semibold text-[var(--gray-900)] mb-3">Candidate Summary</h3>
            <div className="space-y-2">
              {(["new", "interview", "offer", "closed"] as const).map((s) => {
                const count = candidates.filter((c) => c.status === s).length;
                const cs = CAND_STAGE_STYLE[s];
                return (
                  <div key={s} className="flex items-center justify-between text-sm">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cs.bg} ${cs.text}`}>
                      {STAGE_LABEL[s]}
                    </span>
                    <span className="font-medium text-[var(--gray-700)]">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
