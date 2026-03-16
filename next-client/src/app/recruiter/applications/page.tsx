"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { applicationsClient } from "@/lib/api/applications";
import { jobOrdersClient } from "@/lib/api/jobOrders";
import type { Application, JobOrder } from "@/lib/api/types";
import { formatLocation } from "@/components/location-selector";
import {
    Search,
    MapPin,
    X,
    UserPlus,
    CalendarClock,
    BadgeDollarSign,
    XCircle,
    Users,
    ChevronDown,
    AlertCircle,
    Mail,
    Briefcase,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Loader2,
} from "lucide-react";

type ApplicationStatus = 'new' | 'interview' | 'offer' | 'closed';

/* ─── Status config ─────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<
    ApplicationStatus,
    { label: string; badge: string; Icon: React.ComponentType<{ className?: string }> }
> = {
    new: { label: "New", badge: "border-l-[var(--status-blue-text)] text-[var(--status-blue-text)] bg-[var(--status-blue-bg)]", Icon: UserPlus },
    interview: { label: "Interview", badge: "border-l-[var(--status-amber-text)] text-[var(--status-amber-text)] bg-[var(--status-amber-bg)]", Icon: CalendarClock },
    offer: { label: "Offer", badge: "border-l-[var(--status-green-text)] text-[var(--status-green-text)] bg-[var(--status-green-bg)]", Icon: BadgeDollarSign },
    closed: { label: "Closed", badge: "border-l-[var(--gray-400)] text-[var(--gray-500)] bg-[var(--gray-100)]", Icon: XCircle },
};

const STATUS_ORDER: ApplicationStatus[] = ["new", "interview", "offer", "closed"];

const STATUS_SELECT: Record<ApplicationStatus, { bg: string; text: string }> = {
    new: { bg: "var(--status-blue-bg)", text: "var(--status-blue-text)" },
    interview: { bg: "var(--status-amber-bg)", text: "var(--status-amber-text)" },
    offer: { bg: "var(--status-green-bg)", text: "var(--status-green-text)" },
    closed: { bg: "var(--gray-100)", text: "var(--gray-500)" },
};

function initials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}
function toPhone(id: string) {
    const n = parseInt(id.replace(/\D/g, "")) || 1;
    const area = 400 + (n % 500);
    const mid = 200 + ((n * 3) % 800);
    const last = 1000 + ((n * 7) % 9000);
    return `(${area}) ${mid}-${last}`;
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
    const cfg = STATUS_CONFIG[status];
    return (
        <span className={`inline-flex items-center rounded-r border-l-[3px] px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase ${cfg.badge}`}>
            {cfg.label}
        </span>
    );
}

/* ─── Filter Tab ────────────────────────────────────────────────────────── */
function FilterTab({ label, count, active, Icon, onClick }: {
    label: string; count: number; active: boolean;
    Icon: React.ComponentType<{ className?: string }>; onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors ${active
                ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--gray-600)] cursor-pointer hover:bg-[var(--gray-50)]"
                }`}
        >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">{label}</span>
            <span className={`ml-auto text-xs font-semibold ${active ? "text-[var(--accent)]" : "text-[var(--gray-400)]"}`}>{count}</span>
        </button>
    );
}

/* ─── Confirm Dialog ────────────────────────────────────────────────────── */
function ConfirmStatusDialog({ candidate, newStatus, onConfirm, onCancel }: {
    candidate: Application; newStatus: ApplicationStatus;
    onConfirm: () => void; onCancel: () => void;
}) {
    const candidateName = candidate.candidate?.nickname || candidate.candidate?.email || 'Candidate';
    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
            <div className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-modal)] p-5">
                <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--status-amber-bg)] text-[var(--status-amber-text)]">
                        <AlertCircle className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--gray-900)]">Confirm Status Change</h3>
                        <p className="mt-1 text-sm text-[var(--gray-500)]">
                            Move <span className="font-medium text-[var(--gray-700)]">{candidateName}</span> to{" "}
                            <StatusBadge status={newStatus} />?
                        </p>
                        {newStatus === "interview" && <p className="mt-2 text-xs text-[var(--gray-400)]">You&apos;ll be prompted to compose an interview invitation email.</p>}
                        {newStatus === "offer" && <p className="mt-2 text-xs text-[var(--gray-400)]">You&apos;ll be prompted to send an offer notification email.</p>}
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={onCancel} className="rounded-md border border-[var(--border)] px-3.5 py-1.5 text-sm font-medium text-[var(--gray-600)] cursor-pointer hover:bg-[var(--gray-50)] transition">Cancel</button>
                    <button onClick={onConfirm} className="rounded-md bg-[var(--accent)] px-3.5 py-1.5 text-sm font-medium text-white cursor-pointer hover:bg-[var(--accent-hover)] transition">Confirm</button>
                </div>
            </div>
        </div>
    );
}

/* ─── Interview Modal ───────────────────────────────────────────────────── */
interface InterviewDraft {
    applicationId: string; candidateName: string; jobTitle: string;
    subject: string; type: "Zoom" | "Phone" | "Onsite"; date: string; time: string; content: string;
}

function InterviewModal({ draft, onChange, onSend, onClose }: {
    draft: InterviewDraft; onChange: (d: Partial<InterviewDraft>) => void;
    onSend: () => void; onClose: () => void;
}) {
    const inp = "w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm bg-[var(--surface)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]";
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <div className="w-full max-w-lg rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-modal)] overflow-hidden">
                <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--gray-900)]">Send Interview Invitation</h3>
                        <p className="text-xs text-[var(--gray-500)] mt-0.5">To: <span className="font-medium text-[var(--gray-700)]">{draft.candidateName}</span> · {draft.jobTitle}</p>
                    </div>
                    <button onClick={onClose} className="rounded-md p-1.5 text-[var(--gray-400)] cursor-pointer hover:bg-[var(--gray-100)] transition"><X className="h-4 w-4" /></button>
                </div>
                <div className="space-y-3 px-5 py-4">
                    <div className="flex items-center gap-2 rounded-md bg-[var(--status-blue-bg)] px-3 py-2 text-xs text-[var(--status-blue-text)]">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        An email will be sent to the candidate simultaneously.
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-[var(--gray-500)]">Subject</label>
                        <input type="text" className={inp} value={draft.subject} onChange={(e) => onChange({ subject: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-[var(--gray-500)]">Type</label>
                            <select className={inp} value={draft.type} onChange={(e) => onChange({ type: e.target.value as InterviewDraft["type"] })}>
                                <option value="Zoom">Zoom</option><option value="Phone">Phone</option><option value="Onsite">Onsite</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-[var(--gray-500)]">Date</label>
                            <input type="text" className={inp} placeholder="e.g. Mar 10, 2026" value={draft.date} onChange={(e) => onChange({ date: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-[var(--gray-500)]">Time</label>
                            <input type="text" className={inp} placeholder="e.g. 2:30 PM EST" value={draft.time} onChange={(e) => onChange({ time: e.target.value })} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-[var(--gray-500)]">Message</label>
                        <textarea rows={4} className={inp} value={draft.content} onChange={(e) => onChange({ content: e.target.value })} />
                    </div>
                </div>
                <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
                    <button onClick={onClose} className="rounded-md border border-[var(--border)] px-3.5 py-1.5 text-sm font-medium text-[var(--gray-600)] cursor-pointer hover:bg-[var(--gray-50)] transition">Cancel</button>
                    <button onClick={onSend} className="rounded-md bg-[var(--accent)] px-3.5 py-1.5 text-sm font-medium text-white cursor-pointer hover:bg-[var(--accent-hover)] transition">Send Invitation</button>
                </div>
            </div>
        </div>
    );
}

/* ─── Offer Modal ───────────────────────────────────────────────────────── */
interface OfferDraft {
    applicationId: string; candidateName: string; jobTitle: string; content: string;
}

function OfferModal({ draft, onChange, onSend, onClose }: {
    draft: OfferDraft; onChange: (d: Partial<OfferDraft>) => void;
    onSend: () => void; onClose: () => void;
}) {
    const inp = "w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm bg-[var(--surface)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]";
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <div className="w-full max-w-lg rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-modal)] overflow-hidden">
                <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--gray-900)]">Send Offer Notification</h3>
                        <p className="text-xs text-[var(--gray-500)] mt-0.5">To: <span className="font-medium text-[var(--gray-700)]">{draft.candidateName}</span> · {draft.jobTitle}</p>
                    </div>
                    <button onClick={onClose} className="rounded-md p-1.5 text-[var(--gray-400)] cursor-pointer hover:bg-[var(--gray-100)] transition"><X className="h-4 w-4" /></button>
                </div>
                <div className="space-y-3 px-5 py-4">
                    <div className="flex items-center gap-2 rounded-md bg-[var(--status-blue-bg)] px-3 py-2 text-xs text-[var(--status-blue-text)]">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        An email will be sent to the candidate simultaneously.
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-[var(--gray-500)]">Message to Candidate</label>
                        <textarea rows={5} className={inp} value={draft.content} onChange={(e) => onChange({ content: e.target.value })} />
                        <p className="text-[11px] text-[var(--gray-400)]">This is a notification only. No action is required from the candidate at this stage.</p>
                    </div>
                </div>
                <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
                    <button onClick={onClose} className="rounded-md border border-[var(--border)] px-3.5 py-1.5 text-sm font-medium text-[var(--gray-600)] cursor-pointer hover:bg-[var(--gray-50)] transition">Cancel</button>
                    <button onClick={onSend} className="rounded-md bg-[var(--status-green-text)] px-3.5 py-1.5 text-sm font-medium text-white hover:opacity-90 transition">Send Notification</button>
                </div>
            </div>
        </div>
    );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function RecruiterApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
    const [jobFilter, setJobFilter] = useState<string>("all");
    const [confirmPending, setConfirmPending] = useState<{ id: string; newStatus: ApplicationStatus } | null>(null);
    const [interviewDraft, setInterviewDraft] = useState<InterviewDraft | null>(null);
    const [offerDraft, setOfferDraft] = useState<OfferDraft | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);

    // Load data
    useEffect(() => {
        loadData();
        loadJobOrders();
    }, [currentPage, pageSize, statusFilter, jobFilter, query]);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await applicationsClient.list({
                page: currentPage,
                limit: pageSize,
                status: statusFilter !== "all" ? statusFilter : undefined,
                jobOrderId: jobFilter !== "all" ? jobFilter : undefined,
                search: query || undefined,
            });
            setApplications(response.data);
            setTotal(response.total);
        } catch (error) {
            console.error("Failed to load applications:", error);
            toast.error("Failed to load applications");
        } finally {
            setLoading(false);
        }
    };

    const loadJobOrders = async () => {
        try {
            const response = await jobOrdersClient.list({ page: 1, limit: 100 });
            setJobOrders(response.data.filter(j => j.status !== "filled" && j.status !== "paused"));
        } catch (error) {
            console.error("Failed to load job orders:", error);
        }
    };

    const counts = useMemo(() => {
        const c: Record<ApplicationStatus, number> = { new: 0, interview: 0, offer: 0, closed: 0 };
        applications.forEach((r) => { c[r.status]++; });
        return c;
    }, [applications]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const startIdx = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endIdx = Math.min(currentPage * pageSize, total);

    const pageNumbers = useMemo(() => {
        const pages: (number | "...")[] = [];
        if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
        else {
            pages.push(1);
            if (currentPage > 3) pages.push("...");
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    }, [totalPages, currentPage]);

    const handleStatusSelect = (id: string, newStatus: ApplicationStatus) => {
        const current = applications.find((r) => r.id === id)!;
        if (current.status === newStatus) return;
        setConfirmPending({ id, newStatus });
    };

    const handleConfirm = () => {
        if (!confirmPending) return;
        const { id, newStatus } = confirmPending;
        const app = applications.find((r) => r.id === id)!;
        setConfirmPending(null);

        if (newStatus === "interview") {
            const candidateName = app.candidate?.nickname || app.candidate?.email || 'Candidate';
            const jobTitle = app.jobOrder?.title || 'Position';
            setInterviewDraft({
                applicationId: id,
                candidateName,
                jobTitle,
                subject: `Interview Invitation — ${jobTitle}`,
                type: "Zoom",
                date: "",
                time: "",
                content: `Hi ${candidateName.split(" ")[0]}, we'd like to invite you to an interview for the ${jobTitle} role. Please see the details below.`,
            });
        } else if (newStatus === "offer") {
            const candidateName = app.candidate?.nickname || app.candidate?.email || 'Candidate';
            const jobTitle = app.jobOrder?.title || 'Position';
            setOfferDraft({
                applicationId: id,
                candidateName,
                jobTitle,
                content: `Hi ${candidateName.split(" ")[0]}, we are pleased to inform you that you have been selected for the ${jobTitle} position.`,
            });
        } else {
            updateStatus(id, newStatus);
        }
    };

    const updateStatus = async (id: string, newStatus: ApplicationStatus) => {
        try {
            await applicationsClient.updateStatus(id, { status: newStatus });
            toast.success(`Status updated to ${STATUS_CONFIG[newStatus].label}`);
            loadData();
        } catch (error) {
            console.error("Failed to update status:", error);
            toast.error("Failed to update status");
        }
    };

    const handleSendInterview = async () => {
        if (!interviewDraft) return;
        try {
            await applicationsClient.updateStatus(interviewDraft.applicationId, {
                status: "interview",
                interviewSubject: interviewDraft.subject,
                interviewType: interviewDraft.type,
                interviewDate: interviewDraft.date,
                interviewTime: interviewDraft.time,
                interviewContent: interviewDraft.content,
            });
            toast.success("Interview invitation sent");
            setInterviewDraft(null);
            loadData();
        } catch (error) {
            console.error("Failed to send interview:", error);
            toast.error("Failed to send interview invitation");
        }
    };

    const handleSendOffer = async () => {
        if (!offerDraft) return;
        try {
            await applicationsClient.updateStatus(offerDraft.applicationId, { status: "offer", offerContent: offerDraft.content });
            toast.success("Offer notification sent");
            setOfferDraft(null);
            loadData();
        } catch (error) {
            console.error("Failed to send offer:", error);
            toast.error("Failed to send offer notification");
        }
    };

    const confirmCandidate = confirmPending ? applications.find((r) => r.id === confirmPending.id) : null;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold text-[var(--gray-900)]">Applications</h2>
                    <p className="mt-0.5 text-sm text-[var(--gray-500)]">Track and manage candidate applications across all job orders</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                <FilterTab label="All" count={total} active={statusFilter === "all"} Icon={Users} onClick={() => setStatusFilter("all")} />
                {STATUS_ORDER.map((s) => (
                    <FilterTab key={s} label={STATUS_CONFIG[s].label} count={counts[s]} active={statusFilter === s}
                        Icon={STATUS_CONFIG[s].Icon} onClick={() => setStatusFilter((prev) => (prev === s ? "all" : s))} />
                ))}
            </div>

            {/* Search + Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-400)]" />
                    <input type="text" placeholder="Search by name or job title…" value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] pl-9 pr-4 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]" />
                </div>
                <div className="relative">
                    <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--gray-400)]" />
                    <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)}
                        className="h-9 appearance-none rounded-md border border-[var(--border)] bg-[var(--surface)] pl-9 pr-8 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] cursor-pointer">
                        <option value="all">All Job Orders</option>
                        {jobOrders.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--gray-400)]" />
                </div>
                {statusFilter !== "all" && (
                    <div className={`flex items-center gap-1.5 rounded-r border-l-[3px] px-2.5 py-1 text-xs font-bold uppercase ${STATUS_CONFIG[statusFilter].badge}`}>
                        {STATUS_CONFIG[statusFilter].label}
                        <button onClick={() => setStatusFilter("all")} className="ml-1 cursor-pointer hover:opacity-70"><X className="h-3 w-3" /></button>
                    </div>
                )}
                {jobFilter !== "all" && (
                    <div className="flex items-center gap-1.5 rounded-full bg-[var(--accent-light)] text-[var(--accent)] px-2.5 py-1 text-xs font-medium">
                        <Briefcase className="h-3 w-3" />
                        {jobOrders.find(j => j.id === jobFilter)?.title}
                        <button onClick={() => setJobFilter("all")} className="ml-0.5 hover:opacity-70"><X className="h-3 w-3" /></button>
                    </div>
                )}
                <p className="ml-auto text-sm text-[var(--gray-400)] hidden sm:block">
                    <span className="font-medium text-[var(--gray-600)]">{total}</span> total
                </p>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <div className="hidden lg:grid grid-cols-[2fr_2fr_1.2fr_1fr_1fr_1fr] items-center border-b border-[var(--border)] px-5 py-2.5 bg-[var(--gray-50)]">
                    {["Candidate", "Applied For", "Status", "Applied", "Location", "Source"].map((h) => (
                        <span key={h} className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)]">{h}</span>
                    ))}
                </div>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-14 gap-2 text-[var(--gray-400)]">
                        <Loader2 className="h-7 w-7 animate-spin" />
                        <p className="text-sm">Loading applications...</p>
                    </div>
                ) : applications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 gap-2 text-[var(--gray-400)]">
                        <Users className="h-7 w-7" />
                        <p className="text-sm">No applications match your filters.</p>
                    </div>
                ) : (
                    applications.map((c) => {
                        const candidateName = c.candidate?.nickname || c.candidate?.email || 'Unknown';
                        const candidateEmail = c.candidate?.email || '';
                        const jobTitle = c.jobOrder?.title || 'Position';
                        const location = formatLocation(c.locationCity, c.locationState);
                        const appliedAt = new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        const source = c.source === 'self_applied' ? 'Self-applied' : 'Recruiter Import';

                        return (
                            <div key={c.id}
                                className={`flex flex-col lg:grid lg:grid-cols-[2fr_2fr_1.2fr_1fr_1fr_1fr] lg:items-center gap-2 lg:gap-4 border-b border-[var(--border-light)] px-5 py-3 transition-colors last:border-0 cursor-pointer hover:bg-[var(--gray-50)] ${c.status === "closed" ? "opacity-55" : ""}`}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--gray-200)] text-xs font-semibold text-[var(--gray-600)]">
                                        {initials(candidateName)}
                                    </div>
                                    <div className="min-w-0">
                                        <Link href={`/recruiter/applications/${encodeURIComponent(c.id)}`}
                                            className="text-sm font-medium text-[var(--gray-900)] cursor-pointer hover:text-[var(--accent)] transition-colors block truncate">{candidateName}</Link>
                                        <p className="text-xs text-[var(--gray-400)] truncate">{candidateEmail}</p>
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm text-[var(--gray-700)] truncate">{jobTitle}</p>
                                </div>
                                {/* Status — merged colored dropdown */}
                                <div className="relative w-fit">
                                    <select
                                        value={c.status}
                                        onChange={(e) => handleStatusSelect(c.id, e.target.value as ApplicationStatus)}
                                        style={{
                                            backgroundColor: STATUS_SELECT[c.status].bg,
                                            color: STATUS_SELECT[c.status].text,
                                            paddingRight: "1.6rem",
                                        }}
                                        className="appearance-none cursor-pointer rounded-full px-3 py-1 text-xs font-semibold border-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] transition-colors"
                                    >
                                        {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2" style={{ color: STATUS_SELECT[c.status].text }} />
                                </div>
                                <span className="text-sm text-[var(--gray-500)]">{appliedAt}</span>
                                <div className="flex items-center gap-1 text-sm text-[var(--gray-500)] min-w-0">
                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--gray-400)]" />
                                    <span className="truncate">{location}</span>
                                </div>
                                <span className="text-sm text-[var(--gray-500)]">{source}</span>
                            </div>
                        );
                    })
                )}

                {/* Pagination */}
                {!loading && applications.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[var(--border)] px-5 py-3">
                        <div className="flex items-center gap-2 text-xs text-[var(--gray-500)]">
                            <span>Rows</span>
                            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                className="h-7 appearance-none rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 pr-6 text-xs font-medium text-[var(--gray-600)] cursor-pointer">
                                {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                            <span><span className="font-medium text-[var(--gray-700)]">{startIdx}–{endIdx}</span> of <span className="font-medium text-[var(--gray-700)]">{total}</span></span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--gray-400)] cursor-pointer hover:bg-[var(--gray-100)] disabled:opacity-30 disabled:cursor-not-allowed">
                                <ChevronsLeft className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--gray-400)] cursor-pointer hover:bg-[var(--gray-100)] disabled:opacity-30 disabled:cursor-not-allowed">
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            {pageNumbers.map((p, i) =>
                                p === "..." ? (
                                    <span key={`e${i}`} className="flex h-7 w-7 items-center justify-center text-xs text-[var(--gray-400)]">…</span>
                                ) : (
                                    <button key={p} onClick={() => setCurrentPage(p)}
                                        className={`flex h-7 min-w-[1.75rem] items-center justify-center rounded-md text-xs font-medium transition ${p === currentPage
                                            ? "bg-[var(--accent)] text-white" : "text-[var(--gray-500)] cursor-pointer hover:bg-[var(--gray-100)]"
                                            }`}>{p}</button>
                                )
                            )}
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--gray-400)] cursor-pointer hover:bg-[var(--gray-100)] disabled:opacity-30 disabled:cursor-not-allowed">
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--gray-400)] cursor-pointer hover:bg-[var(--gray-100)] disabled:opacity-30 disabled:cursor-not-allowed">
                                <ChevronsRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {confirmPending && confirmCandidate && (
                <ConfirmStatusDialog candidate={confirmCandidate} newStatus={confirmPending.newStatus}
                    onConfirm={handleConfirm} onCancel={() => setConfirmPending(null)} />
            )}
            {interviewDraft && (
                <InterviewModal draft={interviewDraft} onChange={(d) => setInterviewDraft((p) => p ? { ...p, ...d } : p)}
                    onSend={handleSendInterview} onClose={() => setInterviewDraft(null)} />
            )}
            {offerDraft && (
                <OfferModal draft={offerDraft} onChange={(d) => setOfferDraft((p) => p ? { ...p, ...d } : p)}
                    onSend={handleSendOffer} onClose={() => setOfferDraft(null)} />
            )}
        </div>
    );
}
