"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { applicationsClient } from "@/lib/api/applications";
import type { Application } from "@/lib/api/types";
import {
  ArrowLeft, Mail, Phone, MapPin, Linkedin, ExternalLink,
  CalendarClock, BadgeDollarSign, X,
  ChevronRight, Clock, CheckCircle2,
  ChevronDown, Briefcase, FileText,
  Download, Inbox, PenSquare, Save, AlertCircle, Loader2,
} from "lucide-react";

type ApplicationStatus = 'new' | 'interview' | 'offer' | 'closed';

/* ─── Types ───────────────────────────────────────────────────────────────── */
type MessageType = "interview_invite" | "offer_notification";

interface CommunicationEntry {
  id: string; type: MessageType; round?: number;
  subject: string; content: string;
  sender: "recruiter";
  sentAt: string;
  interviewType?: "Zoom" | "Phone" | "Onsite";
  interviewDate?: string; interviewTime?: string;
  confirmed?: boolean;
}

interface WorkExp { role: string; company: string; duration: string; highlights: string[]; }
interface Education { school: string; degree: string; year: string; }
interface Skill { name: string; level: "Expert" | "Intermediate" | "Beginner"; }
interface CandidateProfile {
  email: string; phone: string; linkedin: string;
  targetSalary: string; preferredLocation: string; yearsExp: number;
  summary: string; skills: Skill[]; work: WorkExp[]; education: Education[];
  resumeFile: string; resumeSize: string; resumeUploaded: string;
}

/* ─── Profile builder ─────────────────────────────────────────────────────── */
const SKILL_POOLS: Record<string, Skill[]> = {
  "Backend": [
    { name: "Go", level: "Expert" }, { name: "PostgreSQL", level: "Expert" },
    { name: "Kubernetes", level: "Intermediate" }, { name: "gRPC", level: "Expert" },
    { name: "AWS", level: "Intermediate" }, { name: "Redis", level: "Intermediate" },
    { name: "Docker", level: "Expert" }, { name: "Terraform", level: "Intermediate" },
  ],
  "Frontend": [
    { name: "React", level: "Expert" }, { name: "TypeScript", level: "Expert" },
    { name: "Next.js", level: "Expert" }, { name: "CSS/Tailwind", level: "Intermediate" },
    { name: "GraphQL", level: "Intermediate" }, { name: "Figma", level: "Beginner" },
    { name: "Cypress", level: "Intermediate" },
  ],
  "DevOps": [
    { name: "Kubernetes", level: "Expert" }, { name: "Terraform", level: "Expert" },
    { name: "CI/CD", level: "Expert" }, { name: "AWS", level: "Expert" },
    { name: "Prometheus", level: "Intermediate" }, { name: "Helm", level: "Intermediate" },
    { name: "Python", level: "Intermediate" },
  ],
  "Data": [
    { name: "Python", level: "Expert" }, { name: "SQL", level: "Expert" },
    { name: "Spark", level: "Intermediate" }, { name: "Airflow", level: "Intermediate" },
    { name: "dbt", level: "Intermediate" }, { name: "Snowflake", level: "Intermediate" },
    { name: "TensorFlow", level: "Beginner" },
  ],
  "Security": [
    { name: "Penetration Testing", level: "Expert" }, { name: "SIEM", level: "Expert" },
    { name: "AWS Security", level: "Intermediate" }, { name: "Python", level: "Intermediate" },
    { name: "Compliance (SOC 2)", level: "Intermediate" }, { name: "Incident Response", level: "Expert" },
  ],
  "Mobile": [
    { name: "Swift", level: "Expert" }, { name: "SwiftUI", level: "Expert" },
    { name: "Objective-C", level: "Intermediate" }, { name: "Xcode", level: "Expert" },
    { name: "CoreData", level: "Intermediate" }, { name: "Firebase", level: "Intermediate" },
  ],
  "QA": [
    { name: "Selenium", level: "Expert" }, { name: "Playwright", level: "Expert" },
    { name: "Python", level: "Intermediate" }, { name: "Jest", level: "Intermediate" },
    { name: "CI/CD", level: "Intermediate" }, { name: "JIRA", level: "Expert" },
  ],
};

const COMPANIES = ["Maple Fintech", "Aurora Health", "Shopify", "RBC Ventures", "Hootsuite", "Elastic", "Mattermost", "Cohere", "Wealthsimple", "1Password"];
const SCHOOLS = ["University of Toronto", "University of British Columbia", "McGill University", "Waterloo", "Queen's University", "Concordia"];
const DEGREES = ["B.Sc. Computer Science", "B.Eng. Software Engineering", "M.Sc. Data Science", "M.Eng. Software Engineering", "B.Sc. Mathematics", "B.Comp. Honours"];
const SALARIES = ["CA$140k – CA$160k", "CA$150k – CA$175k", "CA$130k – CA$150k", "CA$160k – CA$185k", "CA$120k – CA$140k"];
const LOCATIONS_PREF = ["Toronto, ON (Hybrid)", "Vancouver, BC (Remote OK)", "Remote · Canada", "Montreal, QC (Onsite)", "Calgary, AB (Hybrid)"];
const SUMMARIES: string[] = [
  "Seasoned engineer with {n}+ years building high-throughput distributed systems. Passionate about clean APIs and developer experience.",
  "Results-driven professional with {n}+ years specializing in scalable cloud infrastructure and modern tooling.",
  "Full-cycle engineer with {n}+ years across early-stage startups and enterprise. Thrives in ambiguous environments.",
  "Technical leader with {n}+ years delivering production-grade software. Strong focus on observability and reliability.",
];

function buildProfile(c: CandidateRecord): CandidateProfile {
  const n = parseInt(c.id.replace(/\D/g, "")) || 700;
  const role = c.role.toLowerCase();
  let pool = SKILL_POOLS["Backend"];
  if (role.includes("frontend") || role.includes("react") || role.includes("next")) pool = SKILL_POOLS["Frontend"];
  else if (role.includes("devops") || role.includes("sre")) pool = SKILL_POOLS["DevOps"];
  else if (role.includes("data") || role.includes("scientist") || role.includes("ml")) pool = SKILL_POOLS["Data"];
  else if (role.includes("security")) pool = SKILL_POOLS["Security"];
  else if (role.includes("mobile") || role.includes("ios") || role.includes("android")) pool = SKILL_POOLS["Mobile"];
  else if (role.includes("qa") || role.includes("test")) pool = SKILL_POOLS["QA"];

  const yrsExp = 4 + (n % 9);
  const handle = c.name.toLowerCase().replace(/[^a-z]/g, ".");

  const work: WorkExp[] = [
    {
      role: c.role,
      company: COMPANIES[n % COMPANIES.length],
      duration: `${2021 - (n % 3)} – Present`,
      highlights: [
        "Led architecture of core platform service handling 2M+ daily requests with 99.9% SLA",
        "Mentored a team of 4 engineers and drove adoption of modern testing practices",
        "Reduced deployment cycle time by 40% by implementing automated CI/CD pipeline",
      ],
    },
    {
      role: c.role.replace("Senior", "").replace("Lead", "").trim() || "Software Engineer",
      company: COMPANIES[(n + 3) % COMPANIES.length],
      duration: `${2018 - (n % 2)} – ${2021 - (n % 3)}`,
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

  const summary = SUMMARIES[n % SUMMARIES.length].replace("{n}", String(yrsExp));

  return {
    email: `${handle}@example.com`,
    phone: `${[416, 604, 514, 403, 613, 780, 519][n % 7]}-555-0${100 + (n % 899)}`,
    linkedin: `https://linkedin.com/in/${handle.replace(/\./g, "-")}`,
    targetSalary: SALARIES[n % SALARIES.length],
    preferredLocation: LOCATIONS_PREF[n % LOCATIONS_PREF.length],
    yearsExp: yrsExp,
    summary,
    skills: pool,
    work,
    education,
    resumeFile: `${c.name.replace(" ", "_")}_Resume.pdf`,
    resumeSize: `${180 + (n % 180)} KB`,
    resumeUploaded: c.appliedAt,
  };
}

/* ─── Status config ───────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<ApplicationStatus, { label: string; badge: string }> = {
  new: { label: "New", badge: "border-l-[var(--status-blue-text)] text-[var(--status-blue-text)] bg-[var(--status-blue-bg)]" },
  interview: { label: "Interview", badge: "border-l-[var(--status-amber-text)] text-[var(--status-amber-text)] bg-[var(--status-amber-bg)]" },
  offer: { label: "Offer", badge: "border-l-[var(--status-green-text)] text-[var(--status-green-text)] bg-[var(--status-green-bg)]" },
  closed: { label: "Closed", badge: "border-l-[var(--gray-400)] text-[var(--gray-500)] bg-[var(--gray-100)]" },
};
const STATUS_ORDER: ApplicationStatus[] = ["new", "interview", "offer", "closed"];

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-r border-l-[3px] px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase ${cfg.badge}`}>
      {cfg.label}
    </span>
  );
}

/* ─── Skill level badge ────────────────────────────────────────────────────── */
const LEVEL_STYLE: Record<string, string> = {
  Expert: "bg-[var(--accent-light)] text-[var(--accent)]",
  Intermediate: "bg-[var(--gray-100)] text-[var(--gray-600)]",
  Beginner: "bg-[var(--gray-50)] text-[var(--gray-400)]",
};

/* ─── Seed messages ────────────────────────────────────────────────────────── */
function seedMessages(c: CandidateRecord): CommunicationEntry[] {
  const msgs: CommunicationEntry[] = [];
  if (c.interviewMessage) {
    msgs.push({
      id: "msg-1", type: "interview_invite", round: 1,
      subject: c.interviewMessage.subject, content: c.interviewMessage.content,
      sender: "recruiter", sentAt: c.interviewMessage.sentAt,
      interviewType: c.interviewMessage.type as "Zoom" | "Phone" | "Onsite",
      interviewDate: c.interviewMessage.date, interviewTime: c.interviewMessage.time,
      confirmed: true,
    });
  }
  return msgs;
}

/* ─── MSG config ───────────────────────────────────────────────────────────── */
const MSG_CONFIG: Record<MessageType, { label: string; iconBg: string; icon: React.ComponentType<{ className?: string }> }> = {
  interview_invite: { label: "Interview Invitation", iconBg: "bg-[var(--status-amber-bg)] text-[var(--status-amber-text)]", icon: CalendarClock },
  offer_notification: { label: "Offer Notification", iconBg: "bg-[var(--status-green-bg)] text-[var(--status-green-text)]", icon: BadgeDollarSign },
};

/* ─── Interview Modal ─────────────────────────────────────────────────────── */
interface InterviewDraft { subject: string; type: "Zoom" | "Phone" | "Onsite"; date: string; time: string; content: string; }

function InterviewModal({ round, candidateName, jobTitle, draft, onChange, onSend, onClose }: {
  round: number; candidateName: string; jobTitle: string;
  draft: InterviewDraft; onChange: (p: Partial<InterviewDraft>) => void;
  onSend: () => void; onClose: () => void;
}) {
  const inp = "w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm bg-[var(--surface)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] text-[var(--gray-900)]";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] p-4">
      <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-modal)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--gray-900)]">{round > 1 ? `Send Round ${round} Interview` : "Send Interview Invitation"}</h3>
            <p className="text-xs text-[var(--gray-500)] mt-0.5">To: <span className="font-medium text-[var(--gray-700)]">{candidateName}</span> · {jobTitle}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[var(--gray-400)] cursor-pointer hover:bg-[var(--gray-100)] transition"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="flex items-center gap-2 rounded-lg bg-[var(--status-blue-bg)] px-3 py-2 text-xs text-[var(--status-blue-text)]">
            <Mail className="h-3.5 w-3.5 shrink-0" /> An email will be sent to the candidate simultaneously.
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--gray-500)] uppercase tracking-wider">Subject</label>
            <input type="text" className={inp} value={draft.subject} onChange={e => onChange({ subject: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "type", label: "Type", el: <select className={inp} value={draft.type} onChange={e => onChange({ type: e.target.value as InterviewDraft["type"] })}><option>Zoom</option><option>Phone</option><option>Onsite</option></select> },
              { key: "date", label: "Date", el: <input type="text" className={inp} placeholder="e.g. Mar 10, 2026" value={draft.date} onChange={e => onChange({ date: e.target.value })} /> },
              { key: "time", label: "Time", el: <input type="text" className={inp} placeholder="e.g. 2:30 PM EST" value={draft.time} onChange={e => onChange({ time: e.target.value })} /> },
            ].map(({ key, label, el }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--gray-500)] uppercase tracking-wider">{label}</label>
                {el}
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--gray-500)] uppercase tracking-wider">Message</label>
            <textarea rows={4} className={inp} value={draft.content} onChange={e => onChange({ content: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-[var(--border)] bg-[var(--gray-50)] px-6 py-4">
          <button onClick={onClose} className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--gray-700)] cursor-pointer hover:bg-[var(--gray-50)] transition">Cancel</button>
          <button onClick={onSend} className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white cursor-pointer hover:bg-[var(--accent-hover)] transition">Send Invitation</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Confirm Status Dialog ───────────────────────────────────────────────── */
function ConfirmStatusDialog({ candidateName, newStatus, onConfirm, onCancel }: {
  candidateName: string; newStatus: ApplicationStatus;
  onConfirm: () => void; onCancel: () => void;
}) {
  const cfg = STATUS_CONFIG[newStatus];
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[var(--overlay)] p-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-modal)] p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--status-amber-bg)] text-[var(--status-amber-text)]">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--gray-900)]">Confirm Status Change</h3>
            <p className="mt-1 text-sm text-[var(--gray-500)]">
              Move <span className="font-semibold text-[var(--gray-700)]">{candidateName}</span> to{" "}
              <span className={`inline-flex items-center rounded-r border-l-[3px] px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase ${cfg.badge}`}>
                {cfg.label}
              </span>?
            </p>
            {newStatus === "interview" && (
              <p className="mt-2 text-xs text-[var(--gray-400)]">You'll be prompted to compose an interview invitation email.</p>
            )}
            {newStatus === "offer" && (
              <p className="mt-2 text-xs text-[var(--gray-400)]">An offer notification email will be sent to the candidate.</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--gray-600)] cursor-pointer hover:bg-[var(--gray-50)] transition">Cancel</button>
          <button onClick={onConfirm} className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white cursor-pointer hover:bg-[var(--accent-hover)] transition">Confirm</button>
        </div>
      </div>
    </div>
  );
}




/* ─── Section header ──────────────────────────────────────────────────────── */
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

/* ─── Main ─────────────────────────────────────────────────────────────────── */
export default function CandidateDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = typeof rawId === "string" ? decodeURIComponent(rawId) : Array.isArray(rawId) ? decodeURIComponent(rawId[0]) : "";

  const foundRecord = CANDIDATE_RECORDS.find((c) => c.id === id);
  const [cand, setCand] = useState<CandidateRecord | null>(foundRecord ?? null);
  const [messages, setMessages] = useState<CommunicationEntry[]>(() => foundRecord ? seedMessages(foundRecord) : []);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewDraft, setInterviewDraft] = useState<InterviewDraft>({ subject: "", type: "Zoom", date: "", time: "", content: "" });
  const [statusDropdown, setStatusDropdown] = useState(false);

  const router = useRouter();

  // Recruiter Notes state
  const [noteText, setNoteText] = useState("Candidate submitted via portal. Strong technical background. Consider for fast-track interview.");
  const [noteEditing, setNoteEditing] = useState(false);
  const [noteSavedAt, setNoteSavedAt] = useState<string | null>(null);
  const [noteSaveToast, setNoteSaveToast] = useState(false);
  const [confirmPending, setConfirmPending] = useState<ApplicationStatus | null>(null);

  if (!cand) return notFound();

  const profile = buildProfile(cand);
  const ini = cand.name.split(" ").map(n => n[0]).join("").toUpperCase();
  const interviewRound = messages.filter(m => m.type === "interview_invite").length + 1;
  const hasActiveInterview = messages.some(m => m.type === "interview_invite");

  // Deterministic source: even ID number = Self-applied, odd = Recruiter Import
  const idNum = parseInt(cand.id.replace(/\D/g, "")) || 0;
  const source = idNum % 2 === 0 ? "Self-applied" : "Recruiter Import";
  const SourceIcon = idNum % 2 === 0 ? Globe : UserCheck;

  const openInterviewModal = () => {
    setInterviewDraft({
      subject: `${interviewRound > 1 ? `Round ${interviewRound} ` : ""}Interview Invitation — ${cand.jobTitle}`,
      type: "Zoom", date: "", time: "",
      content: `Hi ${cand.name.split(" ")[0]}, we'd like to invite you to${interviewRound > 1 ? ` a Round ${interviewRound}` : " an"} interview for the ${cand.jobTitle} position.`,
    });
    setShowInterviewModal(true);
  };

  const handleSendInterview = () => {
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`, type: "interview_invite", round: interviewRound,
      subject: interviewDraft.subject, content: interviewDraft.content,
      sender: "recruiter", sentAt: "Just now",
      interviewType: interviewDraft.type, interviewDate: interviewDraft.date, interviewTime: interviewDraft.time,
      confirmed: false,
    }]);
    setCand(prev => prev ? { ...prev, status: "interview" } : prev);
    setShowInterviewModal(false);
  };

  const confirmInterview = (msgId: string) => setMessages(prev => prev.map(m => m.id === msgId ? { ...m, confirmed: true } : m));

  const handleSaveNote = () => {
    const now = new Date();
    const timeStr = now.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
    setNoteSavedAt(timeStr);
    setNoteEditing(false);
    setNoteSaveToast(true);
    setTimeout(() => setNoteSaveToast(false), 2500);
  };

  const requestStatusChange = (newStatus: ApplicationStatus) => {
    setStatusDropdown(false);
    if (newStatus === cand.status) return;
    setConfirmPending(newStatus);
  };

  const handleConfirmStatus = () => {
    if (!confirmPending) return;
    const newStatus = confirmPending;
    setConfirmPending(null);
    if (newStatus === "interview") {
      openInterviewModal();
      return;
    }
    setCand(prev => prev ? { ...prev, status: newStatus } : prev);
    if (newStatus === "offer") {
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`, type: "offer_notification",
        subject: `Offer Notification — ${cand.jobTitle}`,
        content: `Hi ${cand.name.split(" ")[0]}, we are pleased to inform you that you have been selected for the ${cand.jobTitle} position. Our team will be in touch shortly with the formal offer details.`,
        sender: "recruiter", sentAt: "Just now",
      }]);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-[var(--gray-500)]">
          <Link href="/recruiter/applications" className="flex items-center gap-1 cursor-pointer hover:text-[var(--accent)] transition">
            <ArrowLeft className="h-3.5 w-3.5" /> Candidates
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-[var(--gray-300)]" />
          <span className="text-[var(--gray-700)] font-medium">{cand.name}</span>
        </div>

        {/* Hero Card */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)]">
          <div className="flex flex-col md:flex-row items-center gap-5 px-6 py-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[var(--gray-100)] text-[var(--gray-700)] text-xl font-bold shrink-0">
              {ini}
            </div>
            <div className="flex-1 min-w-0 md:text-left text-center">
              <div className="flex flex-col md:flex-row items-center gap-3 flex-wrap">
                <h1 className="text-xl font-semibold text-[var(--gray-900)]">{cand.name}</h1>
              </div>
              <p className="mt-1 text-sm text-[var(--gray-500)]">{cand.jobTitle}</p>
              <div className="mt-3 flex flex-wrap justify-center md:justify-start items-center gap-4 text-xs text-[var(--gray-500)]">
                <a href={`mailto:${profile.email}`} className="flex items-center gap-1 cursor-pointer hover:text-[var(--accent)] transition"><Mail className="h-3.5 w-3.5" />{profile.email}</a>
                <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{profile.phone}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{cand.location}</span>
                <a href={profile.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1 cursor-pointer hover:text-[var(--accent)] transition"><Linkedin className="h-3.5 w-3.5" />LinkedIn <ExternalLink className="h-2.5 w-2.5" /></a>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 md:self-start mt-4 md:mt-0">
              {(cand.status === "interview" || cand.status === "new") && (
                <button onClick={openInterviewModal}
                  className="flex items-center gap-2 rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white cursor-pointer hover:bg-[var(--accent-hover)] transition">
                  <CalendarClock className="h-4 w-4" />{cand.status === "interview" ? `Send Round ${interviewRound}` : "Send Interview"}
                </button>
              )}
              <div className="relative">
                <button onClick={() => setStatusDropdown(v => !v)}
                  className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--gray-600)] cursor-pointer hover:bg-[var(--gray-50)] transition">
                  Change Status <ChevronDown className="h-3.5 w-3.5 text-[var(--gray-400)]" />
                </button>
                {statusDropdown && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)] overflow-hidden">
                    {STATUS_ORDER.filter(s => s !== cand.status).map(s => {
                      const cfg = STATUS_CONFIG[s];
                      return (
                        <button key={s} onClick={() => requestStatusChange(s)} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-[var(--gray-700)] cursor-pointer hover:bg-[var(--gray-50)] transition">
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body: 2 columns */}
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

          {/* ── Left: Profile + Communication ── */}
          <div className="space-y-5">

            {/* Summary & Preferences */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
              <p className="text-sm text-[var(--gray-600)] leading-relaxed">{profile.summary}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-[var(--gray-500)]"><Briefcase className="h-3.5 w-3.5 text-[var(--gray-400)]" />{profile.yearsExp}+ years experience</span>
                <span className="flex items-center gap-1.5 text-[var(--gray-500)]"><DollarSign className="h-3.5 w-3.5 text-[var(--gray-400)]" />{profile.targetSalary}</span>
                <span className="flex items-center gap-1.5 text-[var(--gray-500)]"><MapPin className="h-3.5 w-3.5 text-[var(--gray-400)]" />{profile.preferredLocation}</span>
              </div>
            </div>

            {/* Skills */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
              <SectionTitle icon={Award} title="Skills" />
              <div className="flex flex-wrap gap-2">
                {profile.skills.map(s => (
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

            {/* Resume Attachment */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
              <SectionTitle icon={FileText} title="Resume / CV" />
              <div className="flex items-center justify-between rounded-md border border-[var(--border-light)] bg-[var(--gray-50)] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--surface)] text-[var(--gray-500)] border border-[var(--border-light)]">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--gray-800)]">{profile.resumeFile}</p>
                    <p className="text-xs text-[var(--gray-400)]">{profile.resumeSize} · Uploaded {profile.resumeUploaded}</p>
                  </div>
                </div>
                <button className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--gray-700)] cursor-pointer hover:bg-[var(--gray-50)] transition">
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
              </div>
            </div>

            {/* Communication History */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-[var(--gray-900)]">Communication History</h2>
                <span className="text-xs text-[var(--gray-400)]">{messages.length} message{messages.length !== 1 ? "s" : ""}</span>
              </div>

              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-[var(--border-light)] bg-[var(--surface)] py-12 text-[var(--gray-400)]">
                  <Inbox className="h-6 w-6" />
                  <p className="text-sm">No messages yet.</p>
                  <p className="text-xs text-[var(--gray-500)]">Send an interview invitation to begin.</p>
                </div>
              ) : (
                messages.map(msg => {
                  const mcfg = MSG_CONFIG[msg.type];
                  const Icon = mcfg.icon;
                  return (
                    <div key={msg.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)] overflow-hidden">
                      <div className="flex items-center justify-between gap-3 border-b border-[var(--border-light)] px-5 py-3 bg-[var(--gray-50)]">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-md ${mcfg.iconBg}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-[var(--gray-700)]">{mcfg.label}</span>
                              {msg.round && <span className="rounded bg-[var(--gray-200)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--gray-600)]">Round {msg.round}</span>}
                            </div>
                            <p className="text-xs text-[var(--gray-400)]">Sent by recruiter · {msg.sentAt}</p>
                          </div>
                        </div>
                        {msg.type === "interview_invite" && (
                          msg.confirmed
                            ? <span className="flex items-center gap-1.5 rounded bg-[var(--status-green-bg)] px-2.5 py-1 text-xs font-medium text-[var(--status-green-text)]">
                              <CheckCircle2 className="h-3 w-3" /> Confirmed
                            </span>
                            : <button onClick={() => confirmInterview(msg.id)}
                              className="flex items-center gap-1.5 rounded border border-[var(--status-amber-text)] bg-[var(--status-amber-bg)] px-2.5 py-1 text-xs font-medium text-[var(--status-amber-text)] hover:opacity-80 transition">
                              <Clock className="h-3 w-3" /> Pending Confirmation
                            </button>
                        )}
                      </div>
                      <div className="px-5 py-4 space-y-2">
                        <p className="text-sm font-semibold text-[var(--gray-800)]">{msg.subject}</p>
                        {msg.type === "interview_invite" && (
                          <div className="flex flex-wrap gap-3 text-xs text-[var(--gray-500)] pb-1">
                            {msg.interviewType && <span className="flex items-center gap-1.5 bg-[var(--gray-50)] px-2 py-1 rounded"><CheckCircle2 className="h-3 w-3 text-[var(--gray-400)]" />{msg.interviewType}</span>}
                            {msg.interviewDate && <span className="flex items-center gap-1.5 bg-[var(--gray-50)] px-2 py-1 rounded"><Clock className="h-3 w-3 text-[var(--gray-400)]" />{msg.interviewDate}{msg.interviewTime ? ` · ${msg.interviewTime}` : ""}</span>}
                          </div>
                        )}
                        <p className="text-sm text-[var(--gray-600)] leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <div className="space-y-4">
            {/* Application info */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
              <h3 className="text-sm font-semibold text-[var(--gray-900)] mb-4">Application</h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Status", value: <StatusBadge status={cand.status} /> },
                  { label: "Applied For", value: <span className="font-medium text-[var(--gray-800)] text-right max-w-[160px]">{cand.jobTitle}</span> },
                  { label: "Applied", value: <span className="text-[var(--gray-600)]">{cand.appliedAt}</span> },
                  { label: "Location", value: <span className="text-[var(--gray-600)]">{cand.location}</span> },
                  {
                    label: "Source",
                    value: (
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${source === "Self-applied"
                        ? "bg-[var(--status-blue-bg)] text-[var(--status-blue-text)]"
                        : "bg-[var(--status-green-bg)] text-[var(--status-green-text)]"
                        }`}>
                        <SourceIcon className="h-3 w-3" />{source}
                      </span>
                    )
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-2">
                    <span className="text-[var(--gray-400)] shrink-0">{label}</span>
                    {value}
                  </div>
                ))}
              </div>
            </div>

            {/* Interview Rounds */}
            {messages.some(m => m.type === "interview_invite") && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
                <h3 className="text-sm font-semibold text-[var(--gray-900)] mb-3">Interview Rounds</h3>
                <div className="space-y-2">
                  {messages.filter(m => m.type === "interview_invite").map(m => (
                    <div key={m.id} className={`flex items-center justify-between rounded-md px-3 py-2 text-xs ${m.confirmed ? "bg-[var(--status-green-bg)] text-[var(--status-green-text)]" : "bg-[var(--status-amber-bg)] text-[var(--status-amber-text)]"}`}>
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-3.5 w-3.5" />
                        <span className="font-medium">Round {m.round}</span>
                        {m.interviewType && <span className="text-[10px] opacity-70">· {m.interviewType}</span>}
                      </div>
                      {m.confirmed
                        ? <span className="font-medium flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Confirmed</span>
                        : <span className="font-medium flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</span>
                      }
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[var(--gray-900)]">Recruiter Notes</h3>
                {!noteEditing && (
                  <button onClick={() => setNoteEditing(true)}
                    className="flex items-center gap-1 text-xs text-[var(--gray-400)] cursor-pointer hover:text-[var(--accent)] transition">
                    <PenSquare className="h-3 w-3" /> Edit
                  </button>
                )}
              </div>
              {noteEditing ? (
                <>
                  <textarea rows={5} value={noteText} onChange={e => setNoteText(e.target.value)}
                    className="w-full resize-none rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--gray-700)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] transition" autoFocus />
                  <div className="flex items-center justify-between mt-2">
                    <button onClick={() => setNoteEditing(false)} className="text-xs text-[var(--gray-400)] cursor-pointer hover:text-[var(--gray-600)] transition">Cancel</button>
                    <button onClick={handleSaveNote}
                      className="flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white cursor-pointer hover:bg-[var(--accent-hover)] transition">
                      <Save className="h-3 w-3" /> Save note
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-md bg-[var(--gray-50)] border border-[var(--border-light)] px-3 py-3 text-sm text-[var(--gray-700)] leading-relaxed whitespace-pre-wrap">
                    {noteText || <span className="text-[var(--gray-400)] italic">No notes yet. Click &quot;Edit&quot; to add one.</span>}
                  </div>
                  {noteSavedAt && (
                    <p className="mt-2 text-[11px] text-[var(--gray-400)] flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-[var(--status-green-text)]" /> Last saved: {noteSavedAt}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Client Decision card */}
            {cand.clientDecision && (() => {
              const dec = cand.clientDecision!;
              const decLabel = dec.type === "request-offer" ? "Offer Requested" : dec.type === "pass" ? "Passed" : "On Hold";
              const decColors = dec.type === "request-offer"
                ? { border: "border-[var(--status-green-text)]/30", bg: "bg-[var(--status-green-bg)]", text: "text-[var(--status-green-text)]", dot: "bg-[var(--status-green-text)]" }
                : dec.type === "pass"
                  ? { border: "border-[var(--danger)]/30", bg: "bg-[var(--danger-bg)]", text: "text-[var(--status-red-text)]", dot: "bg-[var(--status-red-text)]" }
                  : { border: "border-[var(--status-amber-text)]/30", bg: "bg-[var(--status-amber-bg)]", text: "text-[var(--status-amber-text)]", dot: "bg-[var(--status-amber-text)]" };
              return (
                <div className={`rounded-lg border ${decColors.border} ${decColors.bg} p-5`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-sm font-semibold ${decColors.text}`}>Client Decision</h3>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${decColors.bg} ${decColors.text} border ${decColors.border}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${decColors.dot}`} />
                      {decLabel}
                    </span>
                  </div>
                  <p className={`text-xs ${decColors.text}/80`}>Submitted on {dec.submittedAt}</p>
                  {dec.note && (
                    <div className="mt-3 rounded-md border border-current/10 bg-white/30 px-3 py-2">
                      <p className={`text-xs leading-relaxed ${decColors.text}/90 italic`}>&ldquo;{dec.note}&rdquo;</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Note save toast */}
            {noteSaveToast && (
              <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-md bg-[var(--gray-900)] px-4 py-3 text-sm font-medium text-[var(--surface)] shadow-[var(--shadow-md)] animate-slide-in">
                <Check className="h-4 w-4 text-[var(--status-green-text)]" /> Note saved successfully
              </div>
            )}

            {/* Quick actions */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
              <h3 className="text-sm font-semibold text-[var(--gray-900)] mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <a href={`mailto:${profile.email}`}
                  className="flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--gray-600)] cursor-pointer hover:bg-[var(--gray-50)] transition">
                  <Mail className="h-4 w-4 text-[var(--gray-400)]" /> Send Email
                </a>
                <a href={`https://wa.me/${profile.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--gray-600)] cursor-pointer hover:bg-[var(--gray-50)] transition">
                  <MessageCircle className="h-4 w-4 text-[var(--status-green-text)]" /> WhatsApp
                </a>
                <a href={profile.linkedin} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--gray-600)] cursor-pointer hover:bg-[var(--gray-50)] transition">
                  <Linkedin className="h-4 w-4 text-[var(--gray-400)]" /> View LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {confirmPending && (
        <ConfirmStatusDialog candidateName={cand.name} newStatus={confirmPending}
          onConfirm={handleConfirmStatus} onCancel={() => setConfirmPending(null)} />
      )}

      {showInterviewModal && (
        <InterviewModal round={interviewRound} candidateName={cand.name} jobTitle={cand.jobTitle}
          draft={interviewDraft} onChange={p => setInterviewDraft(d => ({ ...d, ...p }))}
          onSend={handleSendInterview} onClose={() => setShowInterviewModal(false)} />
      )}


    </div>
  );
}
