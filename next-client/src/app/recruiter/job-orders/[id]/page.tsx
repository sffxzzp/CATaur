"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { jobOrdersClient } from "@/lib/api/jobOrders";
import { companiesClient } from "@/lib/api/companies";
import type { JobOrder, Company } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Building2, MapPin, Users, CircleDollarSign, Briefcase, MonitorSmartphone, Loader2, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";

// Mock data uses sourcing/interview/offer/filled/paused; form uses active/onhold/closed
// We unify display labels and colors here
function resolveStatus(raw: string): { label: string; cls: string } {
  switch (raw?.toLowerCase()) {
    case "active":
    case "sourcing":
    case "offer":
    case "interview":
      return { label: "Active", cls: "bg-[var(--status-green-bg)] text-[var(--status-green-text)] border-[var(--status-green-text)]/20" };
    case "onhold":
    case "paused":
      return { label: "On Hold", cls: "bg-[var(--status-amber-bg)] text-[var(--status-amber-text)] border-[var(--status-amber-text)]/20" };
    case "closed":
    case "filled":
      return { label: "Closed", cls: "bg-[var(--gray-100)] text-[var(--gray-500)] border-[var(--border)]" };
    default:
      return { label: raw ?? "—", cls: "bg-[var(--gray-100)] text-[var(--gray-500)] border-[var(--border)]" };
  }
}

export default function JobOrderDetails() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<JobOrder | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadJobOrder();
  }, [id]);

  const loadJobOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      const jobData = await jobOrdersClient.getById(id);
      setJob(jobData);

      // Load company if exists
      if (jobData.companyId) {
        try {
          const companyData = await companiesClient.getById(jobData.companyId);
          setCompany(companyData);
        } catch (err) {
          console.error("Failed to load company:", err);
        }
      }
    } catch (err) {
      console.error("Failed to load job order:", err);
      setError("Failed to load job order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-8">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-12 text-center shadow-[var(--shadow-sm)]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--gray-300)] mx-auto mb-3" />
          <p className="text-sm text-[var(--gray-500)]">Loading job order...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-8">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
          <p className="text-sm text-[var(--gray-600)] mb-4">{error || "Job order not found."}</p>
          <Button size="sm" variant="outline" onClick={() => router.push("/recruiter/job-orders")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Job Orders
          </Button>
        </div>
      </div>
    );
  }

  const { label: statusLabel, cls: statusCls } = resolveStatus(job.status);
  const description = job.description?.trim();
  const department = job.tags?.[0] || "";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      {/* Breadcrumb */}
      <div className="text-sm text-[var(--gray-500)] flex items-center gap-2 mb-6">
        <Link href="/recruiter/job-orders" className="hover:text-[var(--accent)] transition">
          Job Orders
        </Link>
        <span className="text-[var(--gray-300)]">/</span>
        <span className="text-[var(--gray-800)] font-medium">{job.title}</span>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-[var(--border)] px-6 py-5 gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-[var(--gray-900)] tracking-tight">{job.title}</h1>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusCls}`}>
                {statusLabel}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-[var(--gray-500)] font-medium flex-wrap">
              {company && <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{company.name}</span>}
              {job.location && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{job.location}</span>}
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{job.openings} opening{job.openings !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <div className="shrink-0">
            <Button size="sm" variant="outline" className="border-[var(--border)] text-[var(--gray-700)] bg-[var(--surface)] cursor-pointer hover:bg-[var(--gray-50)] shadow-sm" asChild>
              <Link href={`/recruiter/job-orders`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
          </div>
        </div>

        {/* Meta fields — compact grid */}
        <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-5 border-b border-[var(--border)]">
          {company && (
            <div>
              <p className="text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider mb-1 flex items-center gap-1"><Building2 className="h-3 w-3" /> Company</p>
              <Link href={`/recruiter/clients/${encodeURIComponent(company.id)}`} className="text-sm font-semibold text-[var(--accent)] hover:underline">{company.name}</Link>
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</p>
            <p className="text-sm font-medium text-[var(--gray-800)]">{job.location || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider mb-1">Department</p>
            <p className="text-sm font-medium text-[var(--gray-800)]">{department || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider mb-1 flex items-center gap-1"><CircleDollarSign className="h-3 w-3" /> Salary</p>
            <p className="text-sm font-medium text-[var(--gray-800)]">{job.salary || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider mb-1">Status</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${statusCls}`}>{statusLabel}</span>
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider mb-1 flex items-center gap-1"><Users className="h-3 w-3" /> Openings</p>
            <p className="text-sm font-medium text-[var(--gray-800)]">{job.openings}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider mb-1 flex items-center gap-1"><Briefcase className="h-3 w-3" /> Type</p>
            <p className="text-sm font-medium text-[var(--gray-800)]">{job.employmentType || "Full-time"}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider mb-1 flex items-center gap-1"><MonitorSmartphone className="h-3 w-3" /> Work Arrangement</p>
            <p className="text-sm font-medium text-[var(--gray-800)]">{job.workArrangement || "Remote"}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider mb-1">Priority</p>
            <p className="text-sm font-medium text-[var(--gray-800)] capitalize">{job.priority || "medium"}</p>
          </div>
        </div>

        {/* Description — primary content area */}
        <div className="px-6 py-6">
          <p className="text-sm font-bold text-[var(--gray-800)] mb-4">Description</p>
          <div className={`rounded-md border border-[var(--border-light)] min-h-[300px] px-6 py-5 ${!description ? "flex items-center justify-center" : ""}`}>
            {description ? (
              <div className="prose prose-sm prose-blue dark:prose-invert max-w-none text-[var(--gray-800)]">
                <ReactMarkdown>{description}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-[var(--gray-400)] italic">No description provided yet.</p>
            )}
          </div>
        </div>

        {/* Footer — company link */}
        {company && (
          <div className="border-t border-[var(--border)] px-6 py-4 bg-[var(--gray-50)] flex items-center justify-between">
            <span className="text-sm text-[var(--gray-500)]">
              Client: <span className="font-semibold text-[var(--gray-800)]">{company.name}</span>
            </span>
            <Button size="sm" variant="outline" className="border-[var(--border)] text-[var(--gray-700)] shadow-sm cursor-pointer hover:bg-[var(--surface)]" asChild>
              <Link href={`/recruiter/clients/${encodeURIComponent(company.id)}`}>View Company</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
