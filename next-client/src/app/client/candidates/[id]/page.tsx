"use client";

import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { request } from "@/lib/request";
import {
    ArrowLeft,
    MapPin,
    Award,
    Briefcase,
    GraduationCap,
    FileText,
    Download,
    CheckCircle2,
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
} from "lucide-react";

/* ─── Profile builder (mirrors recruiter detail) ────────────────────────── */
interface Skill { name: string; level: "Expert" | "Intermediate" | "Beginner"; }
interface WorkExp { role: string; company: string; duration: string; highlights: string[]; }
interface Education { school: string; degree: string; year: string; }
interface CandidateProfile {
    email: string; linkedin: string;
    targetSalary: string; preferredLocation: string; yearsExp: number | string;
    summary: string; skills: Skill[]; work: WorkExp[]; education: Education[];
    resumeFile: string; resumeUploaded: string;
    resumeUrl?: string; // Add this
}

const SKILL_POOLS: Record<string, Skill[]> = {
    Backend: [{ name: "Go", level: "Expert" }, { name: "PostgreSQL", level: "Expert" }, { name: "Kubernetes", level: "Intermediate" }, { name: "gRPC", level: "Expert" }, { name: "AWS", level: "Intermediate" }, { name: "Redis", level: "Intermediate" }, { name: "Docker", level: "Expert" }, { name: "Terraform", level: "Intermediate" }],
    Frontend: [{ name: "React", level: "Expert" }, { name: "TypeScript", level: "Expert" }, { name: "Next.js", level: "Expert" }, { name: "CSS/Tailwind", level: "Intermediate" }, { name: "GraphQL", level: "Intermediate" }, { name: "Figma", level: "Beginner" }, { name: "Cypress", level: "Intermediate" }],
    DevOps: [{ name: "Kubernetes", level: "Expert" }, { name: "Terraform", level: "Expert" }, { name: "CI/CD", level: "Expert" }, { name: "AWS", level: "Expert" }, { name: "Prometheus", level: "Intermediate" }, { name: "Helm", level: "Intermediate" }, { name: "Python", level: "Intermediate" }],
    Data: [{ name: "Python", level: "Expert" }, { name: "SQL", level: "Expert" }, { name: "Spark", level: "Intermediate" }, { name: "Airflow", level: "Intermediate" }, { name: "dbt", level: "Intermediate" }, { name: "Snowflake", level: "Intermediate" }, { name: "TensorFlow", level: "Beginner" }],
    Security: [{ name: "Penetration Testing", level: "Expert" }, { name: "SIEM", level: "Expert" }, { name: "AWS Security", level: "Intermediate" }, { name: "Python", level: "Intermediate" }, { name: "Compliance (SOC 2)", level: "Intermediate" }, { name: "Incident Response", level: "Expert" }],
    Mobile: [{ name: "Swift", level: "Expert" }, { name: "SwiftUI", level: "Expert" }, { name: "Objective-C", level: "Intermediate" }, { name: "Xcode", level: "Expert" }, { name: "CoreData", level: "Intermediate" }, { name: "Firebase", level: "Intermediate" }],
    QA: [{ name: "Selenium", level: "Expert" }, { name: "Playwright", level: "Expert" }, { name: "Python", level: "Intermediate" }, { name: "Jest", level: "Intermediate" }, { name: "CI/CD", level: "Intermediate" }, { name: "JIRA", level: "Expert" }],
};

const COMPANIES = ["Maple Fintech", "Aurora Health", "Shopify", "RBC Ventures", "Hootsuite", "Elastic", "Mattermost", "Cohere", "Wealthsimple", "1Password"];
const SCHOOLS = ["University of Toronto", "University of British Columbia", "McGill University", "Waterloo", "Queen's University", "Concordia"];
const DEGREES = ["B.Sc. Computer Science", "B.Eng. Software Engineering", "M.Sc. Data Science", "M.Eng. Software Engineering", "B.Sc. Mathematics", "B.Comp. Honours"];
const SALARIES = ["CA$140k – CA$160k", "CA$150k – CA$175k", "CA$130k – CA$150k", "CA$160k – CA$185k", "CA$120k – CA$140k"];
const LOCS_PREF = ["Toronto, ON (Hybrid)", "Vancouver, BC (Remote OK)", "Remote · Canada", "Montreal, QC (Onsite)", "Calgary, AB (Hybrid)"];
const SUMMARIES = [
    "Seasoned engineer with {n}+ years building high-throughput distributed systems. Passionate about clean APIs and developer experience.",
    "Results-driven professional with {n}+ years specializing in scalable cloud infrastructure and modern tooling.",
    "Full-cycle engineer with {n}+ years across early-stage startups and enterprise. Thrives in ambiguous environments.",
    "Technical leader with {n}+ years delivering production-grade software. Strong focus on observability and reliability.",
];

// We'll keep the mock profile builder, but we adapt it to use the new API data format to generate the rich content
function buildProfile(c: any): CandidateProfile {
    const prof = c.candidate?.candidateProfile || {};
    const n = parseInt(c.id.replace(/\D/g, "")) || 700;
    const role = (c.jobOrder?.title || "").toLowerCase();
    let pool = SKILL_POOLS.Backend;
    if (role.includes("frontend") || role.includes("react") || role.includes("next")) pool = SKILL_POOLS.Frontend;
    else if (role.includes("devops") || role.includes("sre")) pool = SKILL_POOLS.DevOps;
    else if (role.includes("data") || role.includes("scientist")) pool = SKILL_POOLS.Data;
    else if (role.includes("security")) pool = SKILL_POOLS.Security;
    else if (role.includes("mobile") || role.includes("ios")) pool = SKILL_POOLS.Mobile;
    else if (role.includes("qa") || role.includes("test")) pool = SKILL_POOLS.QA;

    const yrsExp = prof.yearsOfExperience !== null && prof.yearsOfExperience !== undefined ? prof.yearsOfExperience : (4 + (n % 9));
    const handle = (c.candidate?.nickname || c.name || "candidate").toLowerCase().replace(/[^a-z]/g, ".");

    const work: WorkExp[] = [
        {
            role: c.jobOrder?.title || "Software Engineer", company: COMPANIES[n % COMPANIES.length], duration: `${2021 - (n % 3)} – Present`,
            highlights: [
                "Led architecture of core platform service handling 2M+ daily requests with 99.9% SLA",
                "Mentored a team of 4 engineers and drove adoption of modern testing practices",
                "Reduced deployment cycle time by 40% by implementing automated CI/CD pipeline",
            ],
        },
        {
            role: (c.jobOrder?.title || "").replace("Senior", "").replace("Lead", "").trim() || "Software Engineer",
            company: COMPANIES[(n + 3) % COMPANIES.length], duration: `${2018 - (n % 2)} – ${2021 - (n % 3)}`,
            highlights: [
                "Built and shipped core product features used by 10k+ users",
                "Collaborated with design and product on defining technical requirements",
                "Contributed to open-source tooling adopted by the engineering community",
            ],
        },
    ];

    const education: Education[] = [
        { school: SCHOOLS[n % SCHOOLS.length], degree: DEGREES[n % DEGREES.length], year: String(2014 + (n % 5)) },
        { school: SCHOOLS[(n + 2) % SCHOOLS.length], degree: DEGREES[(n + 3) % DEGREES.length], year: String(2016 + (n % 4)) },
    ];

    return {
        email: c.candidate?.email || c.email || `${handle}@example.com`,
        linkedin: prof.linkedin || `https://linkedin.com/in/${handle.replace(/\./g, "-")}`,
        targetSalary: prof.targetSalary || SALARIES[n % SALARIES.length],
        preferredLocation: prof.preferredLocation || LOCS_PREF[n % LOCS_PREF.length],
        yearsExp: yrsExp,
        summary: prof.summary || SUMMARIES[n % SUMMARIES.length].replace("{n}", String(yrsExp)),
        skills: pool,
        work,
        education,
        resumeFile: prof.resumeUrl ? prof.resumeUrl.split('/').pop() : `${(c.candidate?.nickname || c.name || "Candidate").replace(" ", "_")}_Resume.pdf`,
        resumeUploaded: prof.updatedAt ? new Date(prof.updatedAt).toLocaleDateString() : (c.appliedAt || c.createdAt ? new Date(c.appliedAt || c.createdAt).toLocaleDateString() : "Recently"),
        resumeUrl: prof.resumeUrl || null,
    };
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

const LEVEL_STYLE: Record<string, string> = {
    Expert: "bg-[var(--accent-light)] text-[var(--accent)]",
    Intermediate: "bg-[var(--gray-100)] text-[var(--gray-600)]",
    Beginner: "bg-[var(--gray-50)] text-[var(--gray-400)]",
};

function SectionTitle({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
    return (
        <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--gray-100)] text-[var(--gray-500)]">
                <Icon className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--gray-800)]">{title}</h3>
        </div>
    );
}

/* ─── Seeded interview rounds (mirrors recruiter data) ───────────────────── */
interface InterviewRound {
    round: number; type: string; date: string; time: string; confirmed: boolean;
}
function buildInterviewRounds(c: any): InterviewRound[] {
    if (c.status !== "interview" && c.status !== "offer") return [];
    const n = parseInt(c.id.replace(/\D/g, "")) || 700;
    return [{
        round: 1,
        type: c.interviewType || ["Zoom", "Phone", "Onsite"][n % 3],
        date: c.interviewDate || "TBA",
        time: c.interviewTime || "TBA",
        confirmed: true,
    }];
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function ClientCandidateDetailPage() {
    const params = useParams();
    const rawId = params?.id;
    const id = typeof rawId === "string" ? decodeURIComponent(rawId) : Array.isArray(rawId) ? decodeURIComponent(rawId[0]) : "";

    const [cand, setCand] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        request<any>(`/client/candidates/${id}`)
            .then((res) => {
                const payload = res.data?.id ? res.data : res;
                if (payload && payload.id) setCand(payload);
                else setError(`Payload missing id: ${JSON.stringify(res).substring(0, 100)}`);
            })
            .catch((err) => {
                console.error("Failed to fetch candidate details:", err);
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
                    <h2 className="text-lg font-semibold text-red-700 mb-2">Error Loading Candidate</h2>
                    <p className="text-sm text-red-600 break-all">{error}</p>
                    <Link href="/client/candidates" className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:underline">
                        &larr; Back to Candidates
                    </Link>
                </div>
            </div>
        );
    }

    if (!cand) return notFound();

    const profile = buildProfile(cand);
    const fullName = cand.candidate?.nickname || cand.name || "Unknown Candidate";
    const cEmail = cand.candidate?.email || cand.email;
    const cPhone = cand.candidate?.candidateProfile?.phone || cand.candidate?.phone || cand.phone;
    const jTitle = cand.jobOrder?.title || cand.jobTitle || "Unknown Position";
    const locationStr = [cand.locationCity, cand.locationState, cand.locationCountry].filter(Boolean).join(", ") || "Location details unavailable";
    const applyDate = cand.createdAt ? new Date(cand.createdAt).toLocaleDateString() : (cand.appliedAt ? new Date(cand.appliedAt).toLocaleDateString() : "N/A");

    const ini = fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase();
    const idNum = parseInt(cand.id.replace(/\D/g, "")) || 0;
    const source = cand.source === "self_applied" ? "Self Applied" : cand.source === "recruiter_import" ? "Recruiter Import" : (cand.source || "Unknown Source");
    const SourceIcon = cand.source === "self_applied" ? Globe : UserCheck;
    const rounds = buildInterviewRounds(cand);

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">

                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-sm text-[var(--gray-500)]">
                    <Link href="/client/candidates" className="flex items-center gap-1 hover:text-[var(--accent)] transition">
                        <ArrowLeft className="h-3.5 w-3.5" /> Candidates
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
                                <StatusBadge status={cand.status} />
                            </div>
                            <p className="mt-1 text-sm text-[var(--gray-500)]">
                                {jTitle}
                            </p>
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
                                <a href={profile.linkedin} target="_blank" rel="noreferrer"
                                    className="flex items-center gap-1 hover:text-[var(--accent)] transition">
                                    <Linkedin className="h-3.5 w-3.5" />LinkedIn <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body: 2 columns */}
                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

                    {/* Left: profile */}
                    <div className="space-y-5">

                        {/* Summary */}
                        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
                            <p className="text-sm text-[var(--gray-600)] leading-relaxed">{profile.summary}</p>
                            <div className="mt-4 flex flex-wrap gap-4 text-xs">
                                <span className="flex items-center gap-1.5 text-[var(--gray-500)]">
                                    <Briefcase className="h-3.5 w-3.5 text-[var(--gray-400)]" />{profile.yearsExp}+ years experience
                                </span>
                                <span className="flex items-center gap-1.5 text-[var(--gray-500)]">
                                    <Clock className="h-3.5 w-3.5 text-[var(--gray-400)]" />Available: 2 Weeks
                                </span>
                                <span className="flex items-center gap-1.5 text-[var(--gray-500)]">
                                    <MapPin className="h-3.5 w-3.5 text-[var(--gray-400)]" />{profile.preferredLocation}
                                </span>
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
                            <SectionTitle icon={Award} title="Skills" />
                            <div className="flex flex-wrap gap-2">
                                {profile.skills.map((s) => (
                                    <span key={s.name} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium ${LEVEL_STYLE[s.level]}`}>
                                        {s.name}
                                        <span className="opacity-60 font-normal">{s.level}</span>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Work Experience */}
                        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
                            <SectionTitle icon={Briefcase} title="Work Experience" />
                            <div className="space-y-6 mt-4">
                                {profile.work.map((w, i) => (
                                    <div key={i} className="relative pl-5">
                                        <div className="absolute left-0 top-1.5 h-full w-px bg-[var(--gray-200)]" />
                                        <div className="absolute left-[-4px] top-1.5 h-2 w-2 rounded-full border border-[var(--gray-300)] bg-[var(--surface)]" />
                                        <div className="mb-1.5">
                                            <span className="text-sm font-semibold text-[var(--gray-800)]">{w.role}</span>
                                            <span className="text-[var(--gray-400)] mx-2">·</span>
                                            <span className="text-sm text-[var(--gray-600)]">{w.company}</span>
                                            <span className="ml-2 text-xs text-[var(--gray-400)]">{w.duration}</span>
                                        </div>
                                        <ul className="space-y-1 mt-2">
                                            {w.highlights.map((h, j) => (
                                                <li key={j} className="flex items-start gap-2 text-xs text-[var(--gray-500)]">
                                                    <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0 text-[var(--gray-400)]" />{h}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Education */}
                        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
                            <SectionTitle icon={GraduationCap} title="Education" />
                            <div className="space-y-4">
                                {profile.education.map((e, i) => (
                                    <div key={i} className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-[var(--gray-800)]">{e.school}</p>
                                            <p className="text-xs text-[var(--gray-500)] mt-0.5">{e.degree}</p>
                                        </div>
                                        <span className="shrink-0 text-xs text-[var(--gray-400)]">{e.year}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Resume */}
                        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
                            <SectionTitle icon={FileText} title="Resume / CV" />
                            <div className="flex items-center justify-between rounded-md border border-[var(--border-light)] bg-[var(--gray-50)] px-4 py-3">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--surface)] border border-[var(--border-light)] text-[var(--gray-500)] shrink-0">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 pr-4">
                                        <p className="text-sm font-medium text-[var(--gray-800)] truncate h-5">{profile.resumeFile}</p>
                                        <p className="text-xs text-[var(--gray-400)] truncate">Uploaded {profile.resumeUploaded}</p>
                                    </div>
                                </div>
                                {profile.resumeUrl ? (
                                    <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-md border border-[var(--cursor-pointer-border, var(--border))] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--gray-700)] hover:bg-[var(--gray-50)] transition cursor-pointer shrink-0">
                                        <Download className="h-3.5 w-3.5" /> Download
                                    </a>
                                ) : (
                                    <button disabled className="opacity-50 flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--gray-700)] cursor-not-allowed shrink-0">
                                        <Download className="h-3.5 w-3.5" /> No Resume
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right sidebar */}
                    <div className="space-y-4">

                        {/* Application info */}
                        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
                            <h3 className="text-sm font-semibold text-[var(--gray-900)] mb-4">Application</h3>
                            <div className="space-y-3 text-sm">
                                {[
                                    { label: "Status", value: <StatusBadge status={cand.status} /> },
                                    { label: "Applied For", value: <span className="font-medium text-[var(--gray-800)] text-right max-w-[160px]">{jTitle}</span> },
                                    { label: "Applied", value: <span className="text-[var(--gray-600)]">{applyDate}</span> },
                                    { label: "Location", value: <span className="text-[var(--gray-600)]">{locationStr}</span> },
                                    { label: "Availability", value: <span className="text-[var(--gray-600)]">2 Weeks</span> },
                                    {
                                        label: "Source",
                                        value: (
                                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${source === "Self-applied"
                                                ? "bg-[var(--status-blue-bg)] text-[var(--status-blue-text)]"
                                                : "bg-[var(--status-green-bg)] text-[var(--status-green-text)]"}`}>
                                                <SourceIcon className="h-3 w-3" />{source}
                                            </span>
                                        ),
                                    },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex items-start justify-between gap-2">
                                        <span className="text-[var(--gray-400)] shrink-0">{label}</span>
                                        {value}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Interview Rounds (read-only) */}
                        {rounds.length > 0 && (
                            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
                                <h3 className="text-sm font-semibold text-[var(--gray-900)] mb-3">Interview Rounds</h3>
                                <div className="space-y-2">
                                    {rounds.map((r) => (
                                        <div key={r.round}
                                            className={`flex items-center justify-between rounded-md px-3 py-2 text-xs ${r.confirmed
                                                ? "bg-[var(--status-green-bg)] text-[var(--status-green-text)]"
                                                : "bg-[var(--status-amber-bg)] text-[var(--status-amber-text)]"}`}>
                                            <div className="flex items-center gap-2">
                                                <CalendarClock className="h-3.5 w-3.5" />
                                                <span className="font-medium">Round {r.round}</span>
                                                <span className="text-[10px] opacity-70">· {r.type}</span>
                                            </div>
                                            {r.confirmed
                                                ? <span className="font-medium flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Confirmed</span>
                                                : <span className="font-medium flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recruiter Notes (read-only for client) */}
                        {cand.recruiterNotes && (
                            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--gray-100)] text-[var(--gray-500)]">
                                        <StickyNote className="h-3.5 w-3.5" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-[var(--gray-900)]">Recruiter Notes</h3>
                                </div>
                                <div className="rounded-md bg-[var(--gray-50)] border border-[var(--border-light)] px-3 py-3 text-sm text-[var(--gray-700)] leading-relaxed">
                                    {cand.recruiterNotes}
                                </div>
                            </div>
                        )}

                        {/* Offer stage callout */}
                        {cand.status === "offer" && (
                            <div className="rounded-lg border border-[var(--status-green-text)]/30 bg-[var(--status-green-bg)] p-5">
                                <div className="flex items-center gap-2 mb-1">
                                    <BadgeDollarSign className="h-4 w-4 text-[var(--status-green-text)]" />
                                    <h3 className="text-sm font-semibold text-[var(--status-green-text)]">Offer Extended</h3>
                                </div>
                                <p className="text-xs text-[var(--status-green-text)]/80 leading-relaxed">
                                    A formal offer has been extended to this candidate. The recruiter will follow up with details.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
