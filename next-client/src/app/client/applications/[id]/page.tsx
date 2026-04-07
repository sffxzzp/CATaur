"use client";

import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { request } from "@/lib/request";
import {
    ArrowLeft,
    MapPin,
    FileText,
    Download,
    CalendarClock,
    Clock,
    ChevronRight,
    UserCheck,
    Globe,
    BadgeDollarSign,
    Linkedin,
    ExternalLink,
    StickyNote,
    Mail,
    Phone,
    Briefcase,
    CheckCircle2,
    Building2,
    DollarSign,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface CandidateProfile {
    resumeUrl: string | null;
    portfolioUrl: string | null;
    summary: string | null;
    yearsOfExperience: number | null;
    targetSalary: string | null;
    preferredLocation: string | null;
    linkedin: string | null;
    phone: string | null;
    locationCountry: string | null;
    locationState: string | null;
    locationCity: string | null;
    noticePeriod: string | null;
    availableDate: string | null;
    profileStatus: string | null;
    updatedAt: string;
}

interface Candidate {
    id: string;
    email: string;
    nickname: string;
    avatarUrl: string | null;
    phone: string | null;
    candidateProfile: CandidateProfile | null;
}

interface Company {
    id: string;
    name: string;
    contact: string | null;
    website: string | null;
    locationCountry: string | null;
    locationState: string | null;
    locationCity: string | null;
}

interface JobOrder {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string | null;
    locationCountry: string | null;
    locationState: string | null;
    locationCity: string | null;
    openings: number;
    salary: string | null;
    employmentType: string | null;
    workArrangement: string | null;
    company: Company | null;
}

interface Application {
    id: string;
    status: string;
    source: string | null;
    locationCountry: string | null;
    locationState: string | null;
    locationCity: string | null;
    recruiterNotes: string | null;
    interviewType: string | null;
    interviewDate: string | null;
    interviewTime: string | null;
    interviewSubject: string | null;
    interviewContent: string | null;
    interviewSentAt: string | null;
    clientDecisionType: string | null;
    clientDecisionNote: string | null;
    clientDecisionAt: string | null;
    createdAt: string;
    updatedAt: string;
    candidate: Candidate | null;
    jobOrder: JobOrder | null;
}

/* ─── Status config ─────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
    new: { label: "New", badge: "border-l-[var(--status-blue-text)]  text-[var(--status-blue-text)]  bg-[var(--status-blue-bg)]" },
    interview: { label: "Interview", badge: "border-l-[var(--status-amber-text)] text-[var(--status-amber-text)] bg-[var(--status-amber-bg)]" },
    offer: { label: "Offer", badge: "border-l-[var(--status-green-text)] text-[var(--status-green-text)] bg-[var(--status-green-bg)]" },
    closed: { label: "Closed", badge: "border-l-[var(--gray-400)]          text-[var(--gray-500)]          bg-[var(--gray-100)]" },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
    return (
        <span className={`inline-flex items-center rounded-r border-l-[3px] px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase ${cfg.badge}`}>
            {cfg.label}
        </span>
    );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-2">
            <span className="text-[var(--gray-400)] shrink-0 text-sm">{label}</span>
            <div className="text-right text-sm">{children}</div>
        </div>
    );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function ClientApplicationDetailPage() {
    const params = useParams();
    const rawId = params?.id;
    const id = typeof rawId === "string" ? decodeURIComponent(rawId) : Array.isArray(rawId) ? decodeURIComponent(rawId[0]) : "";

    const [app, setApp] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        request<any>(`/client/applications/${id}`)
            .then((res) => {
                const payload = res.data?.id ? res.data : res;
                if (payload?.id) setApp(payload as Application);
                else setError(`No data found for this application.`);
            })
            .catch((err) => {
                console.error("Failed to fetch application details:", err);
                setError(`Fetch error: ${err.message}`);
            })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <div className="text-[var(--gray-500)] flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-[var(--gray-400)] border-t-[var(--accent)] animate-spin" />
                    Loading...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-6">
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 max-w-lg text-center shadow-sm">
                    <h2 className="text-lg font-semibold text-red-700 mb-2">Error Loading Application</h2>
                    <p className="text-sm text-red-600 break-all">{error}</p>
                    <Link href="/client/applications" className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:underline">
                        &larr; Back to Applications
                    </Link>
                </div>
            </div>
        );
    }

    if (!app) return notFound();

    /* ── Derived values from real API data ── */
    const cand = app.candidate;
    const prof = cand?.candidateProfile;
    const job = app.jobOrder;

    const fullName = cand?.nickname || "Unknown Applicant";
    const cEmail = cand?.email;
    const cPhone = prof?.phone || cand?.phone;
    const ini = fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase();

    const jTitle = job?.title || "Unknown Position";
    const company = job?.company;

    // Location: prefer application location, fallback to profile location
    const locationStr = [
        app.locationCity || prof?.locationCity,
        app.locationState || prof?.locationState,
        app.locationCountry || prof?.locationCountry,
    ].filter(Boolean).join(", ") || "Location not specified";

    const jobLocationStr = [job?.locationCity, job?.locationState, job?.locationCountry].filter(Boolean).join(", ") || null;

    const applyDate = app.createdAt ? new Date(app.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A";

    const source = app.source === "self_applied" ? "Self Applied" : app.source === "recruiter_import" ? "Recruiter Import" : (app.source || "Unknown Source");
    const SourceIcon = app.source === "self_applied" ? Globe : UserCheck;

    const resumeFileName = prof?.resumeUrl ? prof.resumeUrl.split("/").pop() : null;
    const resumeUploaded = prof?.updatedAt ? new Date(prof.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : null;

    const hasInterview = app.status === "interview" || app.status === "offer";

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">

                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-sm text-[var(--gray-500)]">
                    <Link href="/client/applications" className="flex items-center gap-1 hover:text-[var(--accent)] transition">
                        <ArrowLeft className="h-3.5 w-3.5" /> Applications
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5 text-[var(--gray-300)]" />
                    <span className="text-[var(--gray-700)] font-medium">{fullName}</span>
                </div>

                {/* Hero Card */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)]">
                    <div className="flex flex-col md:flex-row items-center gap-5 px-6 py-5">
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[var(--gray-100)] text-[var(--gray-700)] text-xl font-bold shrink-0">
                            {ini}
                        </div>
                        <div className="flex-1 min-w-0 md:text-left text-center">
                            <div className="flex flex-col md:flex-row items-center gap-3 flex-wrap">
                                <h1 className="text-xl font-semibold text-[var(--gray-900)]">{fullName}</h1>
                                <StatusBadge status={app.status} />
                            </div>
                            <p className="mt-1 text-sm text-[var(--gray-500)]">{jTitle}</p>
                            <div className="mt-3 flex flex-wrap justify-center md:justify-start items-center gap-4 text-xs text-[var(--gray-500)]">
                                {cEmail && (
                                    <a href={`mailto:${cEmail}`} className="flex items-center gap-1 hover:text-[var(--accent)] transition">
                                        <Mail className="h-3.5 w-3.5" />{cEmail}
                                    </a>
                                )}
                                {cPhone && (
                                    <a href={`tel:${cPhone}`} className="flex items-center gap-1 hover:text-[var(--accent)] transition">
                                        <Phone className="h-3.5 w-3.5" />{cPhone}
                                    </a>
                                )}
                                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{locationStr}</span>
                                {prof?.linkedin && (
                                    <a href={prof.linkedin.startsWith("http") ? prof.linkedin : `https://${prof.linkedin}`}
                                        target="_blank" rel="noreferrer"
                                        className="flex items-center gap-1 hover:text-[var(--accent)] transition">
                                        <Linkedin className="h-3.5 w-3.5" />LinkedIn <ExternalLink className="h-2.5 w-2.5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body: 2 columns */}
                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

                    {/* Left: Profile details */}
                    <div className="space-y-5">

                        {/* Summary */}
                        {prof?.summary && (
                            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
                                <h3 className="text-sm font-semibold text-[var(--gray-800)] mb-3">Summary</h3>
                                <p className="text-sm text-[var(--gray-600)] leading-relaxed">{prof.summary}</p>
                            </div>
                        )}

                        {/* Profile stats */}
                        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
                            <h3 className="text-sm font-semibold text-[var(--gray-800)] mb-4">Candidate Info</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                                {prof?.yearsOfExperience != null && (
                                    <div className="flex items-center gap-2 text-[var(--gray-600)]">
                                        <Briefcase className="h-4 w-4 text-[var(--gray-400)] shrink-0" />
                                        <span>{prof.yearsOfExperience}+ yrs exp</span>
                                    </div>
                                )}
                                {prof?.targetSalary && (
                                    <div className="flex items-center gap-2 text-[var(--gray-600)]">
                                        <DollarSign className="h-4 w-4 text-[var(--gray-400)] shrink-0" />
                                        <span>{prof.targetSalary}</span>
                                    </div>
                                )}
                                {prof?.preferredLocation && (
                                    <div className="flex items-center gap-2 text-[var(--gray-600)]">
                                        <MapPin className="h-4 w-4 text-[var(--gray-400)] shrink-0" />
                                        <span>{prof.preferredLocation}</span>
                                    </div>
                                )}
                                {prof?.noticePeriod && (
                                    <div className="flex items-center gap-2 text-[var(--gray-600)]">
                                        <Clock className="h-4 w-4 text-[var(--gray-400)] shrink-0" />
                                        <span>Notice: {prof.noticePeriod}</span>
                                    </div>
                                )}
                                {prof?.availableDate && (
                                    <div className="flex items-center gap-2 text-[var(--gray-600)]">
                                        <CheckCircle2 className="h-4 w-4 text-[var(--gray-400)] shrink-0" />
                                        <span>Available: {new Date(prof.availableDate).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Resume */}
                        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
                            <h3 className="text-sm font-semibold text-[var(--gray-800)] mb-4">Resume / CV</h3>
                            <div className="flex items-center justify-between rounded-md border border-[var(--border-light)] bg-[var(--gray-50)] px-4 py-3">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--surface)] border border-[var(--border-light)] text-[var(--gray-500)] shrink-0">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 pr-4">
                                        <p className="text-sm font-medium text-[var(--gray-800)] truncate">{resumeFileName || "Resume"}</p>
                                        {resumeUploaded && <p className="text-xs text-[var(--gray-400)]">Uploaded {resumeUploaded}</p>}
                                    </div>
                                </div>
                                {prof?.resumeUrl ? (
                                    <a href={prof.resumeUrl} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--gray-700)] hover:bg-[var(--gray-50)] transition cursor-pointer shrink-0">
                                        <Download className="h-3.5 w-3.5" /> Download
                                    </a>
                                ) : (
                                    <button disabled className="opacity-50 flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--gray-700)] cursor-not-allowed shrink-0">
                                        <Download className="h-3.5 w-3.5" /> No Resume
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Job Order Info */}
                        {job && (
                            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
                                <h3 className="text-sm font-semibold text-[var(--gray-800)] mb-4">Job Order Details</h3>
                                <div className="space-y-3">
                                    {company?.name && (
                                        <div className="flex items-center gap-2 text-sm text-[var(--gray-600)]">
                                            <Building2 className="h-4 w-4 text-[var(--gray-400)] shrink-0" />
                                            <span className="font-medium">{company.name}</span>
                                        </div>
                                    )}
                                    {jobLocationStr && (
                                        <div className="flex items-center gap-2 text-sm text-[var(--gray-600)]">
                                            <MapPin className="h-4 w-4 text-[var(--gray-400)] shrink-0" />
                                            <span>{jobLocationStr}</span>
                                        </div>
                                    )}
                                    {job.employmentType && (
                                        <div className="flex items-center gap-2 text-sm text-[var(--gray-600)]">
                                            <Briefcase className="h-4 w-4 text-[var(--gray-400)] shrink-0" />
                                            <span>{job.employmentType}{job.workArrangement ? ` · ${job.workArrangement}` : ""}</span>
                                        </div>
                                    )}
                                    {job.salary && (
                                        <div className="flex items-center gap-2 text-sm text-[var(--gray-600)]">
                                            <DollarSign className="h-4 w-4 text-[var(--gray-400)] shrink-0" />
                                            <span>{job.salary}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right sidebar */}
                    <div className="space-y-4">

                        {/* Application info */}
                        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
                            <h3 className="text-sm font-semibold text-[var(--gray-900)] mb-4">Application</h3>
                            <div className="space-y-3">
                                <InfoRow label="Status"><StatusBadge status={app.status} /></InfoRow>
                                <InfoRow label="Applied For"><span className="font-medium text-[var(--gray-800)]">{jTitle}</span></InfoRow>
                                <InfoRow label="Applied"><span className="text-[var(--gray-600)]">{applyDate}</span></InfoRow>
                                <InfoRow label="Location"><span className="text-[var(--gray-600)]">{locationStr}</span></InfoRow>
                                <InfoRow label="Source">
                                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${app.source === "self_applied"
                                            ? "bg-[var(--status-blue-bg)] text-[var(--status-blue-text)]"
                                            : "bg-[var(--status-green-bg)] text-[var(--status-green-text)]"
                                        }`}>
                                        <SourceIcon className="h-3 w-3" />{source}
                                    </span>
                                </InfoRow>
                            </div>
                        </div>

                        {/* Interview info (if in interview / offer stage) */}
                        {hasInterview && app.interviewType && (
                            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
                                <h3 className="text-sm font-semibold text-[var(--gray-900)] mb-3">Interview</h3>
                                <div className={`flex items-center justify-between rounded-md px-3 py-2 text-xs bg-[var(--status-green-bg)] text-[var(--status-green-text)]`}>
                                    <div className="flex items-center gap-2">
                                        <CalendarClock className="h-3.5 w-3.5" />
                                        <span className="font-medium">{app.interviewType}</span>
                                        {app.interviewDate && <span className="opacity-70">· {app.interviewDate}</span>}
                                        {app.interviewTime && <span className="opacity-70">{app.interviewTime}</span>}
                                    </div>
                                    <span className="font-medium flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" /> Confirmed
                                    </span>
                                </div>
                                {app.interviewSubject && (
                                    <p className="mt-2 text-xs text-[var(--gray-500)]">{app.interviewSubject}</p>
                                )}
                            </div>
                        )}

                        {/* Recruiter Notes (read-only for client) */}
                        {app.recruiterNotes && (
                            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--gray-100)] text-[var(--gray-500)]">
                                        <StickyNote className="h-3.5 w-3.5" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-[var(--gray-900)]">Recruiter Notes</h3>
                                </div>
                                <div className="rounded-md bg-[var(--gray-50)] border border-[var(--border-light)] px-3 py-3 text-sm text-[var(--gray-700)] leading-relaxed">
                                    {app.recruiterNotes}
                                </div>
                            </div>
                        )}

                        {/* Offer stage callout */}
                        {app.status === "offer" && (
                            <div className="rounded-lg border border-[var(--status-green-text)]/30 bg-[var(--status-green-bg)] p-5">
                                <div className="flex items-center gap-2 mb-1">
                                    <BadgeDollarSign className="h-4 w-4 text-[var(--status-green-text)]" />
                                    <h3 className="text-sm font-semibold text-[var(--status-green-text)]">Offer Extended</h3>
                                </div>
                                <p className="text-xs text-[var(--status-green-text)]/80 leading-relaxed">
                                    A formal offer has been extended to this applicant. The recruiter will follow up with details.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
