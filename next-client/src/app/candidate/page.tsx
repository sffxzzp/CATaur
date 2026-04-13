"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { GuestGate } from "@/components/candidate/guest-gate";
import {
  FileText,
  CheckCircle2,
  CalendarClock,
  ChevronRight,
  Building2,
  TrendingUp,
  Inbox,
  Clock,
  ArrowRight,
  Loader2,
  X,
} from "lucide-react";
import { candidateSelfProfileClient } from "@/lib/api/candidate-self-profile";
import { candidateApplicationsClient } from "@/lib/api/candidate-applications";
import type { Application } from "@/lib/api/types";
import type { CandidateProfileExtended } from "@/lib/api/candidate-profile-types";

// ─── Types ───────────────────────────────────────────────────────────────────

type AppStatus = "new" | "interview" | "offer" | "closed";

const STATUS_META: Record<AppStatus, { label: string; classes: string }> = {
  new: { label: "Application Received", classes: "bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]" },
  interview: { label: "Interview Scheduled", classes: "bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]" },
  offer: { label: "Offer Received", classes: "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]" },
  closed: { label: "Position Filled", classes: "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]" },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

// ─── Onboarding section ───────────────────────────────────────────────────────

function OnboardingSection({ profile }: { profile: CandidateProfileExtended | null }) {
  const hasBasicInfo = !!(profile?.nickname || profile?.phone);
  const hasResume = !!profile?.resumeUrl;

  const steps = [
    {
      key: "info",
      title: "Complete your profile",
      description: "Add your contact info, location, and about section",
      done: hasBasicInfo,
      href: "/candidate/profile",
    },
    {
      key: "resume",
      title: "Upload your resume",
      description: "Attach a resume so recruiters can review your background",
      done: hasResume,
      href: "/candidate/profile",
    },
    {
      key: "jobs",
      title: "Browse & apply to jobs",
      description: "Find your first opportunity and submit an application",
      done: false,
      href: "/candidate/jobs",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-[#111827]">Welcome to CATaur 👋</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Complete a few quick steps to start your job search.
        </p>
        <div className="mx-auto mt-4 h-1 w-48 overflow-hidden rounded-full bg-[#E5E7EB]">
          <div
            className="h-full rounded-full bg-[#1D4ED8] transition-all duration-500"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {doneCount} of {steps.length} steps completed
        </p>
      </div>

      <div className="space-y-2">
        {steps.map((step, i) => {
          return (
            <Link
              key={step.key}
              href={step.href}
              className={`flex items-center gap-4 rounded-lg border p-4 transition-colors ${
                step.done
                  ? "border-[#E5E7EB] bg-white opacity-60"
                  : "border-[#E5E7EB] bg-white hover:border-[#1D4ED8]"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                  step.done ? "bg-[#F0FDF4] text-[#166534]" : "bg-[#EFF6FF] text-[#1D4ED8]"
                }`}
              >
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-semibold">{i + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <p className={`text-base font-medium ${step.done ? "text-muted-foreground line-through" : "text-[#111827]"}`}>
                  {step.title}
                </p>
                {!step.done && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
                )}
              </div>
              {!step.done && <ChevronRight className="h-4 w-4 shrink-0 text-[#6B7280]" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Stats Row ────────────────────────────────────────────────────────────────

// ─── Offer Celebration Banner ────────────────────────────────────────────────────

function OfferCelebrationBanner({ apps }: { apps: Application[] }) {
  const [dismissed, setDismissed] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("dismissedOfferBanners") || "[]"); }
    catch { return []; }
  });

  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem("dismissedOfferBanners", JSON.stringify(next));
  };

  const visible = apps.filter((a) => a.status === "offer" && !dismissed.includes(String(a.id)));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-3">
      {visible.map((app) => {
        const jobTitle = (app as any).jobTitle || (app as any).job?.title || "a position";
        const company = (app as any).companyName || (app as any).job?.company || "";
        return (
          <div
            key={app.id}
            className="relative overflow-hidden rounded-2xl px-6 py-5 text-white shadow-xl"
            style={{
              background: "linear-gradient(135deg, #14532D 0%, #166534 40%, #15803D 70%, #16A34A 100%)",
            }}
          >
            {/* Animated blobs */}
            <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 animate-pulse" />
            <div className="pointer-events-none absolute -left-4 -bottom-4 h-28 w-28 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute right-24 bottom-2 h-16 w-16 rounded-full bg-white/10 animate-pulse" style={{ animationDelay: "0.7s" }} />

            {/* Dismiss button */}
            <button
              onClick={() => dismiss(String(app.id))}
              aria-label="Dismiss"
              className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white/70 hover:bg-white/25 hover:text-white transition cursor-pointer z-10"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="relative flex items-center gap-5 pr-8">
              {/* Trophy icon */}
              <div className="shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl shadow-inner">
                🏆
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                    ✨ Offer Received
                  </span>
                </div>
                <p className="text-lg font-bold leading-tight">
                  Congratulations! You received an offer for{" "}
                  <span className="underline decoration-green-300 underline-offset-2">{jobTitle}</span>
                  {company ? <span className="font-normal"> at {company}</span> : null}
                </p>
                <p className="mt-1 text-sm text-green-100">
                  The recruiter will be in touch with the formal offer details. Exciting times ahead! 🎉
                </p>
              </div>

              <Link
                href="/candidate/applications"
                onClick={() => dismiss(String(app.id))}
                className="shrink-0 flex items-center gap-1.5 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/30 transition"
              >
                View <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}


// ─── Stats row ─────────────────────────────────────────────────────

function StatsRow({ apps }: { apps: Application[] }) {
  const total = apps.length;
  const inProgress = apps.filter((a) => a.status === "new" || a.status === "interview").length;
  const interviews = apps.filter((a) => a.status === "interview").length;
  const offers = apps.filter((a) => a.status === "offer").length;

  const stats = [
    { label: "Total Applied", value: total, icon: FileText, iconCls: "text-[#1D4ED8]", bgCls: "bg-[#EFF6FF]" },
    { label: "In Progress", value: inProgress, icon: TrendingUp, iconCls: "text-[#92400E]", bgCls: "bg-[#FFFBEB]" },
    { label: "Interviews", value: interviews, icon: CalendarClock, iconCls: "text-[#0369A1]", bgCls: "bg-[#E0F2FE]" },
    { label: "Offers", value: offers, icon: CheckCircle2, iconCls: "text-[#166534]", bgCls: "bg-[#F0FDF4]" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white p-4">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${s.bgCls}`}>
              <Icon className={`h-4 w-4 ${s.iconCls}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-[#111827] leading-none">{s.value}</p>
              <p className="mt-0.5 text-sm text-muted-foreground leading-tight truncate">{s.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Upcoming Interviews ──────────────────────────────────────────────────────

const FORMAT_ICON: Record<string, string> = {
  Zoom: "💻",
  Phone: "📞",
  Onsite: "🏢",
};

function UpcomingInterviews({ apps }: { apps: Application[] }) {
  const interviews = apps.filter(
    (a) => a.status === "interview" && a.interviewDate
  );
  if (interviews.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#FDE68A] px-5 py-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-[#92400E]" />
          <h2 className="text-sm font-semibold text-[#92400E] uppercase tracking-wide">
            Upcoming Interviews
          </h2>
          <span className="rounded-full bg-[#FDE68A] px-2 py-0.5 text-xs font-bold text-[#92400E]">
            {interviews.length}
          </span>
        </div>
        <Link
          href="/candidate/applications"
          className="flex items-center gap-1 text-xs font-medium text-[#92400E] hover:underline"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Cards */}
      <div className="divide-y divide-[#FDE68A]">
        {interviews.map((app) => {
          const fmt = app.interviewType || "Zoom";
          const fmtIcon = FORMAT_ICON[fmt] ?? "📅";
          // Safe parse: the date is stored as "Apr 15, 2026" (string), parse directly
          const dateDisplay = app.interviewDate || "";
          const companyName = (app.jobOrder as any)?.company?.name
            || (app.jobOrder as any)?.companyName
            || app.jobOrder?.companyId
            || "Company";

          return (
            <Link
              key={app.id}
              href="/candidate/applications"
              className="group flex items-center gap-4 px-5 py-4 transition hover:bg-[#FEF3C7]"
            >
              {/* Format icon badge */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white border border-[#FDE68A] text-xl shadow-sm">
                {fmtIcon}
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#111827] truncate">
                  {app.interviewSubject || `${fmt} Interview`}
                </p>
                <p className="mt-0.5 text-xs text-[#92400E] font-medium">
                  {app.jobOrder?.title || "Position"}
                  {companyName && companyName !== app.jobOrder?.companyId && (
                    <> · {companyName}</>
                  )}
                </p>
                {/* Action needed badge */}
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-semibold text-[#92400E] border border-[#FDE68A]">
                  <Clock className="h-2.5 w-2.5" /> Action needed — confirm your attendance
                </span>
              </div>

              {/* Date / time */}
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-[#92400E]">{dateDisplay}</p>
                {app.interviewTime && (
                  <p className="mt-0.5 text-xs text-[#92400E] font-medium">{app.interviewTime}</p>
                )}
                <span className="mt-1 inline-block rounded-full bg-white border border-[#FDE68A] px-2 py-0.5 text-[10px] font-semibold text-[#92400E]">
                  {fmt}
                </span>
              </div>

              <ChevronRight className="h-4 w-4 shrink-0 text-[#92400E] transition group-hover:translate-x-0.5" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}


// ─── Recent Activity ──────────────────────────────────────────────────────────

function RecentActivity({ apps }: { apps: Application[] }) {
  const recent = apps.slice(0, 4);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between border-b border-[var(--border-light)] px-5 py-3">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-medium text-[#111827]">Recent Applications</h2>
        </div>
        <Link href="/candidate/applications" className="flex items-center gap-1 text-sm font-medium text-[#1D4ED8] hover:underline">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {recent.length === 0 ? (
        <div className="px-5 py-8 text-center text-base text-muted-foreground">No applications yet.</div>
      ) : (
        <div className="divide-y divide-[var(--border-light)]">
          {recent.map((app) => {
            const meta = STATUS_META[app.status as AppStatus] ?? STATUS_META.new;
            return (
              <Link key={app.id} href="/candidate/applications" className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-[#F9FAFB]">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#F3F4F6]">
                  <Building2 className="h-4 w-4 text-[#6B7280]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-base font-medium text-[#111827]">
                    {app.jobOrder?.title || "Position"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm text-muted-foreground">{app.jobOrder?.companyId || "—"}</span>
                    <span className="text-[#D1D5DB]">·</span>
                    <span className="flex items-center gap-0.5 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(app.createdAt)}
                    </span>
                  </div>
                </div>
                <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium border ${meta.classes}`}>
                  {meta.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Pipeline Funnel ──────────────────────────────────────────────────────────

function PipelineFunnel({ apps }: { apps: Application[] }) {
  const stages: { key: AppStatus; label: string; textCls: string; barCls: string }[] = [
    { key: "new", label: "Applied", textCls: "text-[#1E40AF]", barCls: "bg-[#BFDBFE]" },
    { key: "interview", label: "Interview", textCls: "text-[#92400E]", barCls: "bg-[#FDE68A]" },
    { key: "offer", label: "Offer", textCls: "text-[#166534]", barCls: "bg-[#BBF7D0]" },
    { key: "closed", label: "Closed", textCls: "text-[#6B7280]", barCls: "bg-[#E5E7EB]" },
  ];

  const total = Math.max(apps.length, 1);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center gap-2 border-b border-[var(--border-light)] px-5 py-3">
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-lg font-medium text-[#111827]">Application Pipeline</h2>
      </div>
      <div className="space-y-3 px-5 py-4">
        {stages.map((stage) => {
          const count = apps.filter((a) => a.status === stage.key).length;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={stage.key}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-[#374151]">{stage.label}</span>
                <span className={`text-sm font-semibold ${stage.textCls}`}>{count}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
                <div className={`h-full rounded-full transition-all duration-700 ${stage.barCls}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ profile, apps }: { profile: CandidateProfileExtended | null; apps: Application[] }) {
  const displayName = profile?.nickname || profile?.email?.split("@")[0] || "there";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#111827]">Hi, {displayName} 👋</h1>
        <p className="mt-1 text-base text-muted-foreground">Here&apos;s a summary of your job search activity.</p>
      </div>
      <OfferCelebrationBanner apps={apps} />
      <StatsRow apps={apps} />
      <UpcomingInterviews apps={apps} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RecentActivity apps={apps} />
        </div>
        <div className="lg:col-span-2">
          <PipelineFunnel apps={apps} />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CandidateHomePage() {
  const [profile, setProfile] = useState<CandidateProfileExtended | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileData, appsData] = await Promise.all([
          candidateSelfProfileClient.getMyProfile().catch(() => null),
          candidateApplicationsClient.list({ limit: 50 }).catch(() => null),
        ]);
        setProfile(profileData);
        setApps(appsData?.data ?? []);
        if (profileData?.nickname || profileData?.phone) {
          localStorage.setItem("candidateProfileBasic", "1");
        }
        if (profileData?.resumeUrl) {
          localStorage.setItem("candidateProfileResume", "1");
        }
        if (profileData?.email) {
          localStorage.setItem("candidateEmail", profileData.email);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <GuestGate>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1D4ED8]" />
        </div>
      </GuestGate>
    );
  }

  const profileComplete = !!(profile?.nickname || profile?.phone) && !!profile?.resumeUrl;

  return (
    <GuestGate>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {profileComplete ? (
          <Dashboard profile={profile} apps={apps} />
        ) : (
          <OnboardingSection profile={profile} />
        )}
      </div>
    </GuestGate>
  );
}
