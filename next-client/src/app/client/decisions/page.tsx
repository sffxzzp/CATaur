"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { request } from "@/lib/request";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Briefcase,
  MapPin,
  ChevronDown,
  CalendarClock,
  Users,
  ArrowLeft,
  RotateCcw,
  SendHorizontal,
  MessageSquare,
  PenLine,
  Loader2,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type Decision = "request-offer" | "pass" | "hold";

interface APIApplication {
  applicationId?: string;
  candidateName: string;
  candidateEmail: string;
  jobOrderTitle: string;
  createdAt: string;
  locationCountry: string | null;
  locationState: string | null;
  locationCity: string | null;
  clientDecisionType?: string | null;
}

interface DecisionsResponse {
  pending: number;
  "request-offer": number;
  pass: number;
  hold: number;
  data: APIApplication[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface APIJobOrder {
  id: string;
  title: string;
}

/* ─── Decision config ────────────────────────────────────────────────────── */
const DECISION_CONFIG: Record<Decision, {
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  activeColors: string;
  bg: string;
}> = {
  "request-offer": {
    label: "Request Offer",
    shortLabel: "Offer Requested",
    icon: CheckCircle2,
    activeColors: "text-[var(--status-green-text)] border-[var(--status-green-text)]/50 bg-[var(--status-green-bg)]",
    bg: "var(--status-green-bg)",
  },
  pass: {
    label: "Pass",
    shortLabel: "Passed",
    icon: XCircle,
    activeColors: "text-[var(--status-red-text)] border-[var(--status-red-text)]/50 bg-[var(--danger-bg)]",
    bg: "var(--danger-bg)",
  },
  hold: {
    label: "Hold",
    shortLabel: "On Hold",
    icon: Clock,
    activeColors: "text-[var(--status-amber-text)] border-[var(--status-amber-text)]/50 bg-[var(--status-amber-bg)]",
    bg: "var(--status-amber-bg)",
  },
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */
function DecisionBtn({
  type, active, otherSelected, onClick,
}: {
  type: Decision; active: boolean; otherSelected: boolean; onClick: () => void;
}) {
  const cfg = DECISION_CONFIG[type];
  const Icon = cfg.icon;
  return (
    <button
      onClick={onClick}
      disabled={otherSelected}
      className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition ${active
        ? cfg.activeColors + " cursor-default"
        : otherSelected
          ? "border-[var(--border)] text-[var(--gray-300)] bg-[var(--surface)] cursor-not-allowed opacity-50"
          : "border-[var(--border)] text-[var(--gray-600)] bg-[var(--surface)] cursor-pointer hover:border-[var(--gray-300)] hover:bg-[var(--gray-50)]"
        }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {active ? cfg.shortLabel : cfg.label}
    </button>
  );
}

function StatCard({
  label, count, icon: Icon, bg, text,
}: {
  label: string; count: number; icon: React.ComponentType<{ className?: string }>; bg: string; text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${bg}`}>
        <Icon className={`h-4 w-4 ${text}`} />
      </div>
      <div>
        <p className="text-xl font-semibold text-[var(--gray-900)]">{count}</p>
        <p className="text-xs text-[var(--gray-500)]">{label}</p>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
const PAGE_SIZE = 10;

export default function ClientDecisionsPage() {
  // Local UI state for decisions & notes (client-side pending submit)
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [noteOpen, setNoteOpen] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  // Filters
  const [query, setQuery] = useState("");
  const [jobFilter, setJobFilter] = useState("all");
  const [page, setPage] = useState(1);

  // API data
  const [apiData, setApiData] = useState<DecisionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [allJobs, setAllJobs] = useState<APIJobOrder[]>([]);

  // Fetch job orders for filter dropdown
  useEffect(() => {
    request<any>("/client/orders?limit=100")
      .then((res) => setAllJobs(res.data || []))
      .catch(console.error);
  }, []);

  // Fetch decisions from API
  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("limit", String(PAGE_SIZE));
    if (jobFilter !== "all") qs.set("jobId", jobFilter);
    if (query.trim()) qs.set("candidateNameOrJobOrderTitle", query.trim());

    request<DecisionsResponse>(`/client/decisions?${qs.toString()}`)
      .then((res) => setApiData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, jobFilter, query]);

  const applications = apiData?.data || [];
  const total = apiData?.total || 0;
  const totalPages = apiData?.totalPages || 1;
  const statPending = apiData?.pending ?? 0;
  const statOffer = apiData?.["request-offer"] ?? 0;
  const statPass = apiData?.pass ?? 0;
  const statHold = apiData?.hold ?? 0;

  /* ── Decision actions ── */
  const setDecision = (id: string, d: Decision) =>
    setDecisions((prev) => {
      if (prev[id] === d) {
        const n = { ...prev }; delete n[id];
        setNoteOpen((no) => { const nn = { ...no }; delete nn[id]; return nn; });
        return n;
      }
      setNoteOpen((no) => ({ ...no, [id]: true }));
      return { ...prev, [id]: d };
    });

  const clearDecision = (id: string) => {
    setDecisions((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setNoteOpen((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const toggleNote = (id: string) =>
    setNoteOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  const setNote = (id: string, val: string) =>
    setNotes((prev) => ({ ...prev, [id]: val }));

  const hasDecisions = Object.keys(decisions).length > 0;
  const decisionCount = Object.keys(decisions).length;

  const handleSubmit = () => {
    setSubmitted(true);
    setDecisions({});
    setNotes({});
    setNoteOpen({});
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--gray-900)]">Decisions</h2>
          <p className="mt-0.5 text-sm text-[var(--gray-500)]">
            Review interviewed candidates and tell us who you'd like us to make an offer to
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasDecisions && !submitted && (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white cursor-pointer hover:bg-[var(--accent-hover)] transition"
            >
              <SendHorizontal className="h-4 w-4" />
              Submit ({decisionCount})
            </button>
          )}
          {submitted && (
            <div className="flex items-center gap-2 rounded-md border border-[var(--status-green-text)]/30 bg-[var(--status-green-bg)] px-4 py-2 text-sm font-medium text-[var(--status-green-text)]">
              <CheckCircle2 className="h-4 w-4" />
              Sent to recruiter!
            </div>
          )}
        </div>
      </div>

      {/* Stat cards — use live totals from API */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Pending" count={statPending} icon={CalendarClock}
          bg="bg-[var(--status-amber-bg)]" text="text-[var(--status-amber-text)]" />
        <StatCard label="Offer Requested" count={statOffer} icon={CheckCircle2}
          bg="bg-[var(--status-green-bg)]" text="text-[var(--status-green-text)]" />
        <StatCard label="Passed" count={statPass} icon={XCircle}
          bg="bg-[var(--danger-bg)]" text="text-[var(--status-red-text)]" />
        <StatCard label="On Hold" count={statHold} icon={Clock}
          bg="bg-[var(--gray-100)]" text="text-[var(--gray-500)]" />
      </div>

      {/* Search + job filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-400)]" />
          <input
            type="text"
            placeholder="Search candidates or roles…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] pl-9 pr-4 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
          />
        </div>
        <div className="relative">
          <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--gray-400)]" />
          <select
            value={jobFilter}
            onChange={(e) => { setJobFilter(e.target.value); setPage(1); }}
            className="h-9 appearance-none rounded-md border border-[var(--border)] bg-[var(--surface)] pl-9 pr-8 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] cursor-pointer"
          >
            <option value="all">All Job Orders</option>
            {allJobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--gray-400)]" />
        </div>
        <p className="ml-auto text-sm text-[var(--gray-400)] hidden sm:block">
          <span className="font-medium text-[var(--gray-600)]">{total}</span> total
        </p>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {/* Header */}
        <div className="hidden lg:grid grid-cols-[2fr_2fr_1fr_1fr_auto] items-center border-b border-[var(--border)] bg-[var(--gray-50)] px-5 py-2.5">
          {["Candidate", "Applied For", "Applied", "Location", "Your Decision"].map((h) => (
            <span key={h} className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)]">{h}</span>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2 text-[var(--gray-400)]">
            <Loader2 className="h-7 w-7 animate-spin" />
            <p className="text-sm">Loading decisions...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--gray-400)]">
            <CalendarClock className="h-8 w-8" />
            <p className="text-sm font-medium">No interview-stage candidates yet.</p>
            <p className="text-xs">Candidates will appear here after the recruiter schedules and runs interviews.</p>
          </div>
        ) : (
          applications.map((c, idx) => {
            const rowKey = c.applicationId || `row-${idx}`;
            const dec = decisions[rowKey];
            const cfg = dec ? DECISION_CONFIG[dec] : null;
            const isNoteOpen = !!noteOpen[rowKey];
            const noteVal = notes[rowKey] || "";

            const fullName = c.candidateName || "Unknown";
            const cEmail = c.candidateEmail || "";
            const jobTitle = c.jobOrderTitle || "Unknown Position";
            const locationStr = [c.locationCity, c.locationState, c.locationCountry]
              .filter(Boolean).join(", ") || "—";
            const applyDate = c.createdAt
              ? new Date(c.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
              : "N/A";

            return (
              <div
                key={rowKey}
                className="border-b border-[var(--border-light)] last:border-0 transition-colors"
                style={dec ? { backgroundColor: `color-mix(in srgb, ${cfg!.bg} 25%, transparent)` } : {}}
              >
                {/* Main row */}
                <div className="flex flex-col lg:grid lg:grid-cols-[2fr_2fr_1fr_1fr_auto] lg:items-center gap-3 lg:gap-4 px-5 py-4">
                  {/* Candidate */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${dec === "request-offer" ? "bg-[var(--status-green-bg)] text-[var(--status-green-text)]"
                      : dec === "pass" ? "bg-[var(--danger-bg)] text-[var(--status-red-text)]"
                        : "bg-[var(--status-amber-bg)] text-[var(--status-amber-text)]"
                      }`}>
                      {initials(fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--gray-900)] truncate">
                        {fullName}
                      </p>
                      <p className="text-xs text-[var(--gray-400)] truncate">{cEmail}</p>
                    </div>
                  </div>

                  {/* Applied For */}
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--gray-700)] truncate">{jobTitle}</p>
                  </div>

                  {/* Applied date */}
                  <span className="text-sm text-[var(--gray-500)]">{applyDate}</span>

                  {/* Location */}
                  <div className="flex items-center gap-1 text-sm text-[var(--gray-500)] min-w-0">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--gray-400)]" />
                    <span className="truncate">{locationStr}</span>
                  </div>

                  {/* Decision buttons */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {(["request-offer", "pass", "hold"] as Decision[]).map((d) => (
                      <DecisionBtn
                        key={d}
                        type={d}
                        active={dec === d}
                        otherSelected={!!dec && dec !== d}
                        onClick={() => setDecision(rowKey, d)}
                      />
                    ))}

                    {dec && (
                      <button
                        onClick={() => toggleNote(rowKey)}
                        title={isNoteOpen ? "Hide note" : "Add a note to recruiter"}
                        className={`flex items-center justify-center h-7 w-7 rounded-md border transition cursor-pointer ${isNoteOpen || noteVal
                          ? "border-[var(--accent)]/40 bg-[var(--accent-light)] text-[var(--accent)]"
                          : "border-[var(--border)] text-[var(--gray-400)] hover:text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
                          }`}
                      >
                        <PenLine className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {dec && (
                      <button
                        onClick={() => clearDecision(rowKey)}
                        title="Clear decision"
                        className="flex items-center justify-center h-7 w-7 text-[var(--gray-400)] cursor-pointer hover:text-[var(--gray-600)] hover:bg-[var(--gray-100)] rounded-md transition"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Note textarea */}
                {dec && isNoteOpen && (
                  <div className="px-5 pb-4">
                    <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--gray-600)] mb-2">
                        <MessageSquare className="h-3.5 w-3.5 text-[var(--accent)]" />
                        Note to recruiter for {fullName}
                        <span className="text-[var(--gray-400)] font-normal">(optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        placeholder={
                          dec === "request-offer"
                            ? "e.g. Preferred start date, salary range, or any specific expectations…"
                            : dec === "pass"
                              ? "e.g. Reason for passing, any constructive feedback…"
                              : "e.g. Why on hold, when to revisit…"
                        }
                        value={noteVal}
                        onChange={(e) => setNote(rowKey, e.target.value)}
                        className="w-full rounded-md border border-[var(--border)] bg-[var(--gray-50)] px-3 py-2 text-sm text-[var(--gray-800)] resize-none focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                {/* Note preview when collapsed */}
                {dec && !isNoteOpen && noteVal && (
                  <div className="px-5 pb-3">
                    <button
                      onClick={() => toggleNote(rowKey)}
                      className="flex items-center gap-2 text-xs text-[var(--gray-500)] hover:text-[var(--accent)] transition cursor-pointer"
                    >
                      <MessageSquare className="h-3 w-3 text-[var(--accent)]" />
                      <span className="italic truncate max-w-xs">&ldquo;{noteVal}&rdquo;</span>
                      <span className="text-[var(--gray-400)] not-italic shrink-0">— click to edit</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3 text-xs text-[var(--gray-500)]">
            <span>
              Page <span className="font-medium text-[var(--gray-700)]">{page}</span> of{" "}
              <span className="font-medium text-[var(--gray-700)]">{totalPages}</span>
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--gray-400)] cursor-pointer hover:bg-[var(--gray-100)] disabled:opacity-30 disabled:cursor-not-allowed">
                ‹
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--gray-400)] cursor-pointer hover:bg-[var(--gray-100)] disabled:opacity-30 disabled:cursor-not-allowed">
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="rounded-lg border border-[var(--border-light)] bg-[var(--gray-50)] px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent-light)] text-[var(--accent)] shrink-0 mt-0.5">
            <CalendarClock className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--gray-800)]">How this works</p>
            <p className="mt-1 text-xs text-[var(--gray-500)] leading-relaxed">
              These candidates have completed their interviews. Select <strong>Request Offer</strong> for candidates you'd like to hire — the recruiter will be notified and proceed with extending an offer. Use <strong>Pass</strong> to decline or <strong>Hold</strong> to defer. Use the <strong>note icon</strong> to leave a message for the recruiter about any specific candidate.
            </p>
            <Link href="/client/applications" className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline">
              <ArrowLeft className="h-3 w-3" /> View all applications
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
