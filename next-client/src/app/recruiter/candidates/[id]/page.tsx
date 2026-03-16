"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { applicationsClient } from "@/lib/api/applications";
import { candidateProfileClient } from "@/lib/api/candidate-profile";
import { recruiterCandidatesClient } from "@/lib/api/recruiter-candidates";
import type { Application } from "@/lib/api/types";
import type { CandidateProfileExtended } from "@/lib/api/candidate-profile-types";
import { formatLocation } from "@/components/location-selector";
import {
  type ApplicationStatus,
  type CandidateRecord,
  type ClientDecision,
} from "@/data/recruiter";
import {
  ArrowLeft, Mail, Phone, MapPin, Linkedin, ExternalLink,
  CalendarClock, BadgeDollarSign, X,
  ChevronRight, Clock, CheckCircle2,
  ChevronDown, Briefcase, GraduationCap, Award, FileText,
  Download, Inbox, DollarSign, Target, PenSquare, Save, Check, AlertCircle, MessageCircle,
  Trash2, UserCheck, Globe
} from "lucide-react";

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

function formatShortDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function parseJsonArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function mapApplicationToCandidateRecord(app: Application): CandidateRecord {
  const name = app.candidate?.nickname || app.candidate?.email || "Candidate";
  const email = app.candidate?.email || "—";
  const jobTitle = app.jobOrder?.title || "—";
  const location = formatLocation(app.locationCity || null, app.locationState || null) || formatLocation(app.jobOrder?.locationCity || null, app.jobOrder?.locationState || null) || "—";

  let clientDecision: ClientDecision | undefined;
  if (app.clientDecisionType && app.clientDecisionAt) {
    clientDecision = {
      type: app.clientDecisionType as any,
      note: app.clientDecisionNote ?? undefined,
      submittedAt: formatShortDate(app.clientDecisionAt as any),
    };
  }

  const interviewMessage = app.interviewDate && app.interviewSubject && app.interviewContent && app.interviewSentAt
    ? {
      subject: String(app.interviewSubject),
      type: (app.interviewType || "Zoom") as any,
      date: String(app.interviewDate),
      time: String(app.interviewTime || ""),
      content: String(app.interviewContent),
      sentAt: formatShortDate(app.interviewSentAt as any),
    }
    : undefined;

  return {
    id: app.id,
    name,
    email,
    role: jobTitle,
    jobTitle,
    jobId: app.jobOrderId,
    status: app.status as any,
    appliedAt: formatShortDate(app.createdAt as any),
    location,
    availability: "—",
    lastContact: app.interviewSentAt ? formatShortDate(app.interviewSentAt as any) : "—",
    source: app.source as any,
    recruiterNotes: app.recruiterNotes ?? undefined,
    clientDecision,
    interviewMessage,
  };
}

function mapExtendedToCandidateProfile(ext: CandidateProfileExtended, fallback: CandidateProfile): CandidateProfile {
  const resumeFile = ext.resumeUrl ? (ext.resumeUrl.split('/').pop() || fallback.resumeFile) : fallback.resumeFile;

  const work = ext.workExperience?.length
    ? ext.workExperience.map((w) => ({
      role: w.role,
      company: w.company,
      duration: `${w.startDate || ""} – ${w.isCurrent ? "Present" : (w.endDate || "")}`.trim(),
      highlights: parseJsonArray(w.highlights),
    }))
    : [];

  const education = ext.education?.length
    ? ext.education.map((e) => ({
      school: e.school,
      degree: [e.degree, e.fieldOfStudy].filter(Boolean).join(" · "),
      year: e.graduationYear ? String(e.graduationYear) : "",
    }))
    : [];

  const skills = ext.skills?.length
    ? ext.skills.map((s) => ({ name: s.skillName, level: s.skillLevel }))
    : [];

  return {
    email: ext.email || fallback.email,
    phone: ext.phone || fallback.phone,
    linkedin: ext.linkedin || fallback.linkedin,
    targetSalary: ext.targetSalary || fallback.targetSalary,
    preferredLocation: ext.preferredLocation || fallback.preferredLocation,
    yearsExp: ext.yearsOfExperience ?? fallback.yearsExp,
    summary: ext.summary || fallback.summary,
    skills,
    work,
    education,
    resumeFile,
    resumeSize: fallback.resumeSize,
    resumeUploaded: fallback.resumeUploaded,
  };
}

/* ─── Profile builder ─────────────────────────────────────────────────────── */
function buildProfile(c: CandidateRecord): CandidateProfile {
  // This page started as a static mock; avoid generating fake Work/Education on real imported candidates.
  return {
    email: c.email || "—",
    phone: "—",
    linkedin: "—",
    targetSalary: "—",
    preferredLocation: c.location || "—",
    yearsExp: 0,
    summary: "",
    skills: [],
    work: [],
    education: [],
    resumeFile: "—",
    resumeSize: "",
    resumeUploaded: c.appliedAt || "—",
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

function InterviewModal({ round, candidateName, jobTitle, draft, onChange, onSend, onClose, disabled = false }: {
  round: number; candidateName: string; jobTitle: string;
  draft: InterviewDraft; onChange: (p: Partial<InterviewDraft>) => void;
  onSend: () => void; onClose: () => void;
  disabled?: boolean;
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
          <button
            onClick={onSend}
            disabled={disabled}
            className={`rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-[var(--accent-hover)]"}`}
          >
            Send Invitation
          </button>
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

/* ─── Confirm Delete Dialog ───────────────────────────────────────────────── */
function ConfirmDeleteDialog({ candidateName, onConfirm, onCancel }: {
  candidateName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] p-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-modal)] p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--danger-bg)] text-[var(--danger)]">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--gray-900)]">Delete Candidate</h3>
            <p className="mt-1 text-sm text-[var(--gray-500)]">
              Are you sure you want to delete <span className="font-semibold text-[var(--gray-700)]">{candidateName}</span>? This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--gray-600)] cursor-pointer hover:bg-[var(--gray-50)] transition">Cancel</button>
          <button onClick={onConfirm} className="rounded-md bg-[var(--danger)] px-4 py-2 text-sm font-medium text-white cursor-pointer hover:opacity-90 transition">Delete</button>
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

/* ─── Edit Candidate Modal ─────────────────────────────────────────────────── */
function EditCandidateModal({
  cand,
  profileEmail,
  profilePhone,
  onSave,
  onClose,
}: {
  cand: CandidateRecord;
  profileEmail: string;
  profilePhone: string;
  onSave: (updates: Partial<CandidateRecord>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: cand.name,
    email: profileEmail,
    phone: profilePhone,
    role: cand.jobTitle,
    location: cand.location,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      jobTitle: form.role.trim(),
      role: form.role.trim(),
      location: form.location.trim(),
    } as any);
  };

  const inp = "w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--gray-900)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] transition";
  const lbl = "text-xs font-semibold text-[var(--gray-500)] uppercase tracking-wider block mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] p-4">
      <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-modal)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--gray-900)]">Edit Profile</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-[var(--gray-400)] cursor-pointer hover:bg-[var(--gray-100)] transition">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className={lbl}>Full Name</label>
            <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Email</label>
              <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inp} />
            </div>
            <div>
              <label className={lbl}>Phone</label>
              <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inp} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Role / Title</label>
              <input required type="text" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={inp} />
            </div>
            <div>
              <label className={lbl}>Location</label>
              <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className={inp} />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--gray-700)] cursor-pointer hover:bg-[var(--gray-50)] transition">Cancel</button>
            <button type="submit" className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white cursor-pointer hover:bg-[var(--accent-hover)] transition">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main ─────────────────────────────────────────────────────────────────── */
export default function CandidateDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = typeof rawId === "string" ? decodeURIComponent(rawId) : Array.isArray(rawId) ? decodeURIComponent(rawId[0]) : "";

  const [cand, setCand] = useState<CandidateRecord | null>(null);
  const [messages, setMessages] = useState<CommunicationEntry[]>([]);
  const [profileData, setProfileData] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewDraft, setInterviewDraft] = useState<InterviewDraft>({ subject: "", type: "Zoom", date: "", time: "", content: "" });
  const [statusDropdown, setStatusDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const router = useRouter();

  // Recruiter Notes state
  const [noteText, setNoteText] = useState("");
  const [noteEditing, setNoteEditing] = useState(false);
  const [noteSavedAt, setNoteSavedAt] = useState<string | null>(null);
  const [noteSaveToast, setNoteSaveToast] = useState(false);
  const [confirmPending, setConfirmPending] = useState<ApplicationStatus | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const app = await recruiterCandidatesClient.getById(id);
        if (cancelled) return;
        const record = mapApplicationToCandidateRecord(app);
        setCand(record);
        setMessages(seedMessages(record));
        setNoteText(app.recruiterNotes || "");

        const fallback = buildProfile(record);
        try {
          const ext = await candidateProfileClient.getProfile(app.candidateId);
          if (!cancelled) setProfileData(mapExtendedToCandidateProfile(ext, fallback));
        } catch {
          if (!cancelled) setProfileData(fallback);
        }
      } catch (err: any) {
        toast.error(err?.message || "Failed to load candidate");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 text-sm text-[var(--gray-500)]">
          Loading candidate...
        </div>
      </div>
    );
  }

  if (!cand) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-3">
          <div className="text-sm text-[var(--gray-600)]">Candidate not found.</div>
          <Link
            href="/recruiter/candidates"
            className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--gray-700)] hover:bg-[var(--gray-50)] transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Candidates
          </Link>
        </div>
      </div>
    );
  }

  const profile = profileData ?? buildProfile(cand);
  const ini = cand.name.split(" ").map(n => n[0]).join("").toUpperCase();
  const interviewRound = messages.filter(m => m.type === "interview_invite").length + 1;
  const hasActiveInterview = messages.some(m => m.type === "interview_invite");

  const source = cand.source === "self_applied" ? "Self-applied" : "Recruiter Import";
  const SourceIcon = cand.source === "self_applied" ? Globe : UserCheck;

  const openInterviewModal = () => {
    setInterviewDraft({
      subject: `${interviewRound > 1 ? `Round ${interviewRound} ` : ""}Interview Invitation — ${cand.jobTitle}`,
      type: "Zoom", date: "", time: "",
      content: `Hi ${cand.name.split(" ")[0]}, we'd like to invite you to${interviewRound > 1 ? ` a Round ${interviewRound}` : " an"} interview for the ${cand.jobTitle} position.`,
    });
    setShowInterviewModal(true);
  };

  const handleSendInterview = async () => {
    if (!id) return;
    if (!interviewDraft.date?.trim() || !interviewDraft.content?.trim()) {
      toast.error("Interview date and message are required");
      return;
    }
    try {
      setUpdatingStatus(true);
      const updated = await applicationsClient.updateStatus(id, {
        status: "interview",
        interviewSubject: interviewDraft.subject,
        interviewType: interviewDraft.type,
        interviewDate: interviewDraft.date,
        interviewTime: interviewDraft.time,
        interviewContent: interviewDraft.content,
      });
      const record = mapApplicationToCandidateRecord(updated);
      setCand(record);
      setNoteText(updated.recruiterNotes || "");
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`, type: "interview_invite", round: interviewRound,
        subject: interviewDraft.subject, content: interviewDraft.content,
        sender: "recruiter", sentAt: "Just now",
        interviewType: interviewDraft.type, interviewDate: interviewDraft.date, interviewTime: interviewDraft.time,
        confirmed: false,
      }]);
      toast.success("Interview invitation sent");
      setShowInterviewModal(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to send interview invitation");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const confirmInterview = (msgId: string) => setMessages(prev => prev.map(m => m.id === msgId ? { ...m, confirmed: true } : m));

  const handleSaveNote = async () => {
    if (!id) return;
    try {
      setSavingNote(true);
      const updated = await applicationsClient.updateCandidate(id, { recruiterNotes: noteText });
      const now = new Date();
      const timeStr = now.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
      setNoteSavedAt(timeStr);
      setNoteEditing(false);
      setNoteText(updated.recruiterNotes || "");
      toast.success("Note saved");
      setNoteSaveToast(true);
      setTimeout(() => setNoteSaveToast(false), 2500);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  const requestStatusChange = (newStatus: ApplicationStatus) => {
    setStatusDropdown(false);
    if (newStatus === cand.status) return;
    setConfirmPending(newStatus);
  };

  const handleConfirmStatus = async () => {
    if (!confirmPending) return;
    const newStatus = confirmPending;
    setConfirmPending(null);
    if (newStatus === "interview") {
      openInterviewModal();
      return;
    }
    if (!id) return;
    try {
      setUpdatingStatus(true);
      const offerContent = newStatus === "offer"
        ? `Hi ${cand.name.split(" ")[0]}, we are pleased to inform you that you have been selected for the ${cand.jobTitle} position. Our team will be in touch shortly with the formal offer details.`
        : undefined;

      const updated = await applicationsClient.updateStatus(id, {
        status: newStatus,
        ...(offerContent ? { offerContent } : {}),
      });

      const record = mapApplicationToCandidateRecord(updated);
      setCand(record);
      setNoteText(updated.recruiterNotes || "");

      if (newStatus === "offer" && offerContent) {
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}`, type: "offer_notification",
          subject: `Offer Notification — ${cand.jobTitle}`,
          content: offerContent,
          sender: "recruiter", sentAt: "Just now",
        }]);
      }
      toast.success(`Status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveEdit = async (updates: Partial<CandidateRecord>) => {
    if (!id) return;
    try {
      const updated = await applicationsClient.updateCandidate(id, {
        nickname: updates.name,
        email: updates.email,
        phone: (updates as any).phone,
        location: updates.location,
      });
      const record = mapApplicationToCandidateRecord(updated);
      // Keep UI-only fields from the modal (e.g. role) if provided
      setCand({ ...record, ...(updates.role ? { role: updates.role } : {}) });
      setNoteText(updated.recruiterNotes || "");
      toast.success("Candidate updated");
      setShowEditModal(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update candidate");
    }
  };

  const handleDownloadResume = async () => {
    if (!id) return;
    try {
      const res = await applicationsClient.getResumeUrl(id);
      if (!res.resumeUrl) {
        toast.error("No resume available for this candidate");
        return;
      }
      window.open(res.resumeUrl, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      toast.error(err?.message || "Failed to load resume link");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-[var(--gray-500)]">
          <Link href="/recruiter/candidates" className="flex items-center gap-1 cursor-pointer hover:text-[var(--accent)] transition">
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
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--gray-700)] cursor-pointer hover:bg-[var(--gray-50)] transition"
              >
                <PenSquare className="h-4 w-4" /> Edit Profile
              </button>
              {/* Delete button */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 rounded-md border border-[var(--danger)]/30 bg-[var(--danger-bg)] px-3 py-1.5 text-sm font-medium text-[var(--danger)] cursor-pointer hover:bg-[var(--danger)]/5 transition"
              >
                <Trash2 className="h-4 w-4 text-[var(--danger)]" /> Delete
              </button>
            </div>
          </div>
        </div>

        {/* Body: 2 columns */}
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

          {/* ── Left: Main Profile ── */}
          <div className="space-y-6">

            {/* Summary & Preferences */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
              <p className="text-sm text-[var(--gray-700)] leading-relaxed">{profile.summary}</p>
              <div className="mt-5 flex flex-wrap gap-4 text-xs bg-[var(--gray-50)] border border-[var(--border-light)] p-3 rounded-lg">
                <span className="flex items-center gap-1.5 text-[var(--gray-600)] font-medium"><Briefcase className="h-3.5 w-3.5 text-[var(--gray-400)]" />{profile.yearsExp}+ years xp</span>
                <span className="flex items-center gap-1.5 text-[var(--gray-600)] font-medium"><DollarSign className="h-3.5 w-3.5 text-[var(--gray-400)]" />{profile.targetSalary}</span>
                <span className="flex items-center gap-1.5 text-[var(--gray-600)] font-medium"><MapPin className="h-3.5 w-3.5 text-[var(--gray-400)]" />{profile.preferredLocation}</span>
              </div>
            </div>

            {/* Work Experience */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
              <SectionTitle icon={Briefcase} title="Work Experience" />
              <div className="space-y-6 mt-4">
                {profile.work.map((w, i) => (
                  <div key={i} className="relative pl-5">
                    <div className="absolute left-0 top-1.5 h-full w-px bg-[var(--border)]" />
                    <div className="absolute left-[-4px] top-1.5 h-2 w-2 rounded-full border border-[var(--border)] bg-[var(--surface)]" />
                    <div className="mb-1.5 flex flex-wrap items-baseline gap-x-2">
                      <span className="text-sm font-semibold text-[var(--gray-900)]">{w.role}</span>
                      <span className="text-[var(--gray-400)]">·</span>
                      <span className="text-sm text-[var(--gray-600)]">{w.company}</span>
                      <span className="ml-auto text-xs text-[var(--gray-400)] font-medium">{w.duration}</span>
                    </div>
                    <ul className="space-y-1.5 mt-2.5">
                      {w.highlights.map((h, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-[var(--gray-600)] leading-relaxed">
                          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[var(--gray-400)]" />{h}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
              <SectionTitle icon={GraduationCap} title="Education" />
              <div className="space-y-4 mt-4">
                {profile.education.map((e, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 sm:gap-4 border-b border-[var(--border-light)] pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold text-[var(--gray-900)]">{e.school}</p>
                      <p className="text-sm text-[var(--gray-600)] mt-0.5">{e.degree}</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-[var(--gray-500)] bg-[var(--gray-50)] px-2 py-0.5 rounded-full border border-[var(--border-light)]">{e.year}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <div className="space-y-6">

            {/* Quick Connect */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-500)] mb-3">Quick Connect</h3>
              <div className="space-y-2">
                <a href={`mailto:${profile.email}`}
                  className="flex items-center gap-2.5 rounded-md border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--gray-700)] hover:bg-[var(--gray-50)] transition">
                  <Mail className="h-4 w-4 text-[var(--gray-400)]" /> Send Email
                </a>
                <a href={`https://wa.me/${profile.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2.5 rounded-md border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--gray-700)] hover:bg-[var(--gray-50)] transition">
                  <MessageCircle className="h-4 w-4 text-[#25D366]" /> WhatsApp Connect
                </a>
                <a href={profile.linkedin} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2.5 rounded-md border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--gray-700)] hover:bg-[var(--gray-50)] transition">
                  <Linkedin className="h-4 w-4 text-[#0077B5]" /> View LinkedIn
                </a>
              </div>
            </div>

            {/* Resume */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-500)] mb-3">Resume</h3>
              <div className="flex flex-col gap-3 rounded-md border border-[var(--border-light)] bg-[var(--gray-50)] p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)] text-[var(--accent)] border border-[var(--border)] shadow-[var(--shadow-xs)]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--gray-900)] truncate">{profile.resumeFile}</p>
                    <p className="text-xs text-[var(--gray-500)]">{profile.resumeSize} PDF</p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadResume}
                  className="flex w-full items-center justify-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--gray-700)] hover:bg-[var(--gray-50)] transition cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> Download File
                </button>
              </div>
            </div>

            {/* Skills */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-500)] mb-3">Key Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map(s => (
                  <span key={s.name} className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 border border-transparent text-xs font-semibold ${LEVEL_STYLE[s.level]}`}>
                    {s.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm relative">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-500)]">Recruiter Notes</h3>
                {!noteEditing && (
                  <button onClick={() => setNoteEditing(true)}
                    className="flex items-center gap-1 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition font-medium cursor-pointer">
                    <PenSquare className="h-3 w-3" /> Edit
                  </button>
                )}
              </div>
              {noteEditing ? (
                <>
                  <textarea rows={5} value={noteText} onChange={e => setNoteText(e.target.value)}
                    className="w-full resize-none rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--gray-700)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] transition" autoFocus />
                  <div className="flex items-center justify-between mt-2">
                    <button onClick={() => setNoteEditing(false)} className="text-xs text-[var(--gray-400)] hover:text-[var(--gray-600)] transition font-medium cursor-pointer">Cancel</button>
                    <button
                      onClick={handleSaveNote}
                      disabled={savingNote}
                      className={`flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition ${savingNote ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-[var(--accent-hover)]"}`}
                    >
                      <Save className="h-3 w-3" /> Save Note
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative rounded-md bg-[#FFFBEA] dark:bg-[var(--status-amber-bg)]/20 border border-[#FDE68A] dark:border-[var(--status-amber-text)]/20 p-3">
                    <p className="text-sm text-[#92400E] dark:text-[var(--status-amber-text)] leading-relaxed whitespace-pre-wrap">
                      {noteText || <span className="opacity-70 italic">No notes yet. Click "Edit" to add one.</span>}
                    </p>
                  </div>
                  {noteSavedAt && (
                    <p className="mt-2.5 text-[11px] font-medium text-[var(--gray-400)] flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-[var(--status-green-text)]" /> Last saved: {noteSavedAt}
                    </p>
                  )}
                </>
              )}

              {/* Note save toast */}
              {noteSaveToast && (
                <div className="absolute top-[-48px] right-0 z-50 flex items-center gap-2 rounded-md bg-[var(--gray-900)] px-4 py-3 text-sm font-medium text-[var(--surface)] shadow-[var(--shadow-md)] animate-slide-in">
                  <Check className="h-4 w-4 text-[var(--status-green-text)]" /> Note saved successfully
                </div>
              )}
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
          onSend={handleSendInterview} onClose={() => setShowInterviewModal(false)} disabled={updatingStatus} />
      )}

      {showEditModal && (
        <EditCandidateModal
          cand={cand}
          profileEmail={profile.email}
          profilePhone={profile.phone}
          onSave={handleSaveEdit}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDeleteDialog
          candidateName={cand.name}
          onConfirm={async () => {
            try {
              await recruiterCandidatesClient.delete(id);
              toast.success("Candidate deleted");
              setShowDeleteConfirm(false);
              router.push("/recruiter/candidates");
            } catch (err: any) {
              toast.error(err?.message || "Failed to delete candidate");
            }
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
