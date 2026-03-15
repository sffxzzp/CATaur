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
        <p className="mt-2 text-sm text-[#6B7280]">
          Complete a few quick steps to start your job search.
        </p>
        <div className="mx-auto mt-4 h-1 w-48 overflow-hidden rounded-full bg-[#E5E7EB]">
          <div
            className="h-full rounded-full bg-[#1D4ED8] transition-all duration-500"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-[#6B7280]">
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
                <p className={`text-sm font-medium ${step.done ? "text-[#6B7280] line-through" : "text-[#111827]"}`}>
                  {step.title}
                </p>
                {!step.done && (
                  <p className="mt-0.5 text-xs text-[#6B7280]">{step.description}</p>
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
              <p className="mt-0.5 text-xs text-[#6B7280] leading-tight truncate">{s.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Upcoming Interviews ──────────────────────────────────────────────────────

function UpcomingInterviews({ apps }: { apps: Application[] }) {
  const interviews = apps.filter(
    (a) => a.status === "interview" && a.interviewDate
  );
  if (interviews.length === 0) return null;

  return (
    <div className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB]">
      <div className="flex items-center gap-2 border-b border-[#FDE68A] px-5 py-3">
        <CalendarClock className="h-4 w-4 text-[#92400E]" />
        <h2 className="text-sm font-semibold text-[#92400E]">Upcoming Interviews</h2>
      </div>
      <div className="divide-y divide-[#FDE68A]">
        {interviews.map((app) => (
          <Link
            key={app.id}
            href="/candidate/applications"
            className="flex items-center gap-4 px-5 py-4 transition hover:bg-[#FEF3C7]"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#111827]">
                {app.interviewType || "Interview"}
              </p>
              <p className="mt-0.5 text-xs text-[#6B7280]">
                {app.jobOrder?.title || "Position"} · {app.jobOrder?.companyId || "Company"}
              </p>
            </div>
            <div className="shrink-0 text-right">
              {app.interviewDate && (
                <p className="text-sm font-semibold text-[#92400E]">
                  {new Date(app.interviewDate).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })}
                </p>
              )}
              {app.interviewTime && (
                <p className="text-xs text-[#6B7280]">{app.interviewTime}</p>
              )}
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#92400E]" />
          </Link>
        ))}
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
          <Inbox className="h-4 w-4 text-[#6B7280]" />
          <h2 className="text-sm font-semibold text-[#111827]">Recent Applications</h2>
        </div>
        <Link href="/candidate/applications" className="flex items-center gap-1 text-xs font-medium text-[#1D4ED8] hover:underline">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {recent.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-[#6B7280]">No applications yet.</div>
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
                  <p className="truncate text-sm font-medium text-[#111827]">
                    {app.jobOrder?.title || "Position"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-[#6B7280]">{app.jobOrder?.companyId || "—"}</span>
                    <span className="text-[#D1D5DB]">·</span>
                    <span className="flex items-center gap-0.5 text-xs text-[#9CA3AF]">
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
        <TrendingUp className="h-4 w-4 text-[#6B7280]" />
        <h2 className="text-sm font-semibold text-[#111827]">Application Pipeline</h2>
      </div>
      <div className="space-y-3 px-5 py-4">
        {stages.map((stage) => {
          const count = apps.filter((a) => a.status === stage.key).length;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={stage.key}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-[#374151]">{stage.label}</span>
                <span className={`text-xs font-semibold ${stage.textCls}`}>{count}</span>
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
        <h1 className="text-xl font-semibold text-[#111827]">Hi, {displayName} 👋</h1>
        <p className="mt-1 text-sm text-[#6B7280]">Here&apos;s a summary of your job search activity.</p>
      </div>
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
