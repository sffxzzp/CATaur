"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { JOBS, type Job, type JobType, type WorkArrangement } from "@/data/jobs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { request } from "@/lib/request";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Users,
  DollarSign,
  Building2,
  Clock,
  Loader2,
} from "lucide-react";
import ApplyPanel from "./apply-panel";

// ─── Markdown renderer ─────────────────────────────────────────────────────────

function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return <p className="text-sm text-[#6B7280] italic">No description provided yet.</p>;
  return (
    <div className="prose prose-sm md:prose-base prose-blue dark:prose-invert max-w-none text-[#374151] break-words [overflow-wrap:anywhere]">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ─── Work arrangement badge ───────────────────────────────────────────────────

function ArrangementBadge({ arrangement }: { arrangement: string }) {
  const styles: Record<string, string> = {
    Remote: "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]",
    Hybrid: "bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]",
    Onsite: "bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]",
  };
  const cls = styles[arrangement] ?? styles.Onsite;
  return (
    <span className={`rounded border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {arrangement}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [job, setJob] = useState<Job | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const loadJob = async () => {
      try {
        const res = await request(`/candidate/jobs/${slug}`);
        const apiJob = res as any;
        if (apiJob && (apiJob.data || apiJob.id || apiJob.title)) {
          const raw = apiJob.data || apiJob;
          setJobId(raw.id);
          setJob({
            slug: raw.id,
            title: raw.title || "Untitled",
            company: raw.company?.name || "Unknown Company",
            location: raw.location || "Location TBD",
            locationMeta: { country: "CA" as const, state: "", city: "" },
            status: "active",
            type: "Full-time" as JobType,
            workArrangement: "Remote" as WorkArrangement,
            department: raw.department || "",
            salary: raw.salary || undefined,
            openings: raw.openings || 1,
            description: raw.description || "",
            postedDate: raw.createdAt ? new Date(raw.createdAt).toLocaleDateString() : "Recently",
          });
        } else {
          setJob(null);
        }
      } catch (err: any) {
        console.error("Failed to load job details", err);
        setError(err?.message || "Failed to load job details");
        setJob(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadJob();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1D4ED8]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-6">
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <strong>Error:</strong> {error}
        </div>
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link href="/candidate/jobs">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to Job Search
          </Link>
        </Button>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-6">
        <h2 className="text-lg font-semibold text-[#111827]">Job not found</h2>
        <p className="mt-1 text-sm text-[#6B7280]">This position may no longer be available or the ID is incorrect.</p>
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link href="/candidate/jobs">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to Job Search
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Back bar */}
      <div className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex h-12 max-w-7xl items-center px-6">
          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-[#374151]">
            <Link href="/candidate/jobs">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Job Search
            </Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pt-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_296px]">

          {/* ── Main content ─────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Header card */}
            <div className="rounded-lg border border-[#E5E7EB] bg-white p-6">
              <div className="flex items-start gap-4">
                {/* Company avatar */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[#F3F4F6] text-lg font-bold text-[#374151] select-none">
                  {job.company.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold text-[#111827]">{job.title}</h1>
                    <ArrangementBadge arrangement={job.workArrangement} />
                  </div>

                  <p className="mt-1 flex items-center gap-1.5 text-sm text-[#374151]">
                    <Building2 className="h-3.5 w-3.5 text-[#6B7280]" />
                    {job.company}
                    {job.department && (
                      <span className="text-[#6B7280]">· {job.department}</span>
                    )}
                  </p>

                  {/* Meta chips */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="flex items-center gap-1.5 rounded border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-1 text-xs text-[#374151]">
                      <MapPin className="h-3 w-3 text-[#6B7280]" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1.5 rounded border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-1 text-xs text-[#374151]">
                      <Briefcase className="h-3 w-3 text-[#6B7280]" />
                      {job.type}
                    </span>
                    {job.salary && (
                      <span className="flex items-center gap-1.5 rounded border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1 text-xs font-semibold text-[#1E40AF]">
                        <DollarSign className="h-3 w-3" />
                        {job.salary}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 rounded border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-1 text-xs text-[#374151]">
                      <Users className="h-3 w-3 text-[#6B7280]" />
                      {job.openings} {job.openings === 1 ? "opening" : "openings"}
                    </span>
                    <span className="flex items-center gap-1.5 rounded border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-1 text-xs text-[#6B7280]">
                      <Clock className="h-3 w-3" />
                      Posted {job.postedDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description card */}
            <div className="rounded-lg border border-[#E5E7EB] bg-white p-6">
              <MarkdownRenderer content={job.description} />
            </div>

          </div>

          {/* ── Sidebar ──────────────────────────────────────────────── */}
          <div>
            <div className="sticky top-[56px] rounded-lg border border-[#E5E7EB] bg-white p-5">
              <ApplyPanel slug={job.slug} jobId={jobId || job.slug} jobTitle={job.title} company={job.company} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
