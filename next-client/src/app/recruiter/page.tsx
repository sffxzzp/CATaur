"use client";

import { useEffect, useState } from "react";
import { request } from "@/lib/request";
import {
  BriefcaseBusiness,
  Users,
  Target,
  FileText,
  Plus,
  Loader2,
} from "lucide-react";
import Link from "next/link";

type DashboardData = {
  myJobOrders: number;
  myApplications: number;
  pendingInterviews: number;
  awaitingDecision: number;
  recentApplications: Array<{
    id: string;
    status: string;
    createdAt: string;
    candidate?: { nickname?: string; email?: string };
    jobOrder?: { title?: string };
  }>;
};

type JobOrderStats = {
  active: number;
  onhold: number;
  closed: number;
};

type ApplicationStats = {
  new: number;
  interview: number;
  offer: number;
  closed: number;
};

export default function RecruiterPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [jobOrderStats, setJobOrderStats] = useState<JobOrderStats>({ active: 0, onhold: 0, closed: 0 });
  const [applicationStats, setApplicationStats] = useState<ApplicationStats>({ new: 0, interview: 0, offer: 0, closed: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboard, jobOrders, applications] = await Promise.all([
          request<DashboardData>("/recruiter/dashboard"),
          request<{ data: Array<{ status: string }> }>("/recruiter/job-orders?page=1&limit=1000"),
          request<{ data: Array<{ status: string }> }>("/recruiter/applications?page=1&limit=1000"),
        ]);

        setDashboardData(dashboard);

        // Calculate job order stats
        const jobStats = { active: 0, onhold: 0, closed: 0 };
        if (jobOrders?.data) {
          jobOrders.data.forEach((jo: any) => {
            if (jo.status === "active") jobStats.active++;
            else if (jo.status === "onhold") jobStats.onhold++;
            else if (jo.status === "closed") jobStats.closed++;
          });
        }
        setJobOrderStats(jobStats);

        // Calculate application stats
        const appStats = { new: 0, interview: 0, offer: 0, closed: 0 };
        if (applications?.data) {
          applications.data.forEach((app: any) => {
            if (app.status === "new") appStats.new++;
            else if (app.status === "interview") appStats.interview++;
            else if (app.status === "offer") appStats.offer++;
            else if (app.status === "closed") appStats.closed++;
          });
        }
        setApplicationStats(appStats);
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--gray-900)]">Welcome back</h2>
          <p className="text-sm text-[var(--gray-500)] mt-0.5">Here&apos;s what&apos;s happening with your pipeline today.</p>
        </div>
        <Link
          href="/recruiter/job-orders/new"
          className="inline-flex items-center gap-2 rounded-md bg-[var(--accent)] px-3.5 py-2 text-sm font-medium text-white cursor-pointer hover:bg-[var(--accent-hover)] transition-colors self-start"
        >
          <Plus className="h-4 w-4" />
          New Job Order
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-start justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--gray-50)]">
              <BriefcaseBusiness className="h-4 w-4 text-[var(--gray-500)]" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-semibold text-[var(--gray-900)] tracking-tight">{dashboardData?.myJobOrders || 0}</h3>
            <p className="text-xs text-[var(--gray-500)] mt-1">My Job Orders</p>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-start justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--gray-50)]">
              <FileText className="h-4 w-4 text-[var(--gray-500)]" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-semibold text-[var(--gray-900)] tracking-tight">{dashboardData?.myApplications || 0}</h3>
            <p className="text-xs text-[var(--gray-500)] mt-1">Total Applications</p>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-start justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--gray-50)]">
              <Users className="h-4 w-4 text-[var(--gray-500)]" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-semibold text-[var(--gray-900)] tracking-tight">{dashboardData?.pendingInterviews || 0}</h3>
            <p className="text-xs text-[var(--gray-500)] mt-1">Pending Interviews</p>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-start justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--gray-50)]">
              <Target className="h-4 w-4 text-[var(--gray-500)]" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-semibold text-[var(--gray-900)] tracking-tight">{dashboardData?.awaitingDecision || 0}</h3>
            <p className="text-xs text-[var(--gray-500)] mt-1">Awaiting Decision</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 xl:grid-cols-2">
        {/* Job Orders by Status */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border-light)] px-5 py-4">
            <h3 className="text-sm font-semibold text-[var(--gray-900)]">Job Orders by Status</h3>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[var(--gray-600)]">Active</span>
                <span className="text-[var(--gray-900)] font-medium">{jobOrderStats.active}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--gray-100)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--status-green-text)]" style={{ width: `${Math.max(5, (jobOrderStats.active / (jobOrderStats.active + jobOrderStats.onhold + jobOrderStats.closed || 1)) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[var(--gray-600)]">On Hold</span>
                <span className="text-[var(--gray-900)] font-medium">{jobOrderStats.onhold}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--gray-100)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--status-amber-text)]" style={{ width: `${Math.max(5, (jobOrderStats.onhold / (jobOrderStats.active + jobOrderStats.onhold + jobOrderStats.closed || 1)) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[var(--gray-600)]">Closed</span>
                <span className="text-[var(--gray-900)] font-medium">{jobOrderStats.closed}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--gray-100)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--gray-400)]" style={{ width: `${Math.max(5, (jobOrderStats.closed / (jobOrderStats.active + jobOrderStats.onhold + jobOrderStats.closed || 1)) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Applications by Status */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border-light)] px-5 py-4">
            <h3 className="text-sm font-semibold text-[var(--gray-900)]">Applications by Status</h3>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[var(--gray-600)]">New</span>
                <span className="text-[var(--gray-900)] font-medium">{applicationStats.new}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--gray-100)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(5, (applicationStats.new / (applicationStats.new + applicationStats.interview + applicationStats.offer + applicationStats.closed || 1)) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[var(--gray-600)]">Interview</span>
                <span className="text-[var(--gray-900)] font-medium">{applicationStats.interview}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--gray-100)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--status-blue-text)]" style={{ width: `${Math.max(5, (applicationStats.interview / (applicationStats.new + applicationStats.interview + applicationStats.offer + applicationStats.closed || 1)) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[var(--gray-600)]">Offer</span>
                <span className="text-[var(--gray-900)] font-medium">{applicationStats.offer}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--gray-100)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--status-amber-text)]" style={{ width: `${Math.max(5, (applicationStats.offer / (applicationStats.new + applicationStats.interview + applicationStats.offer + applicationStats.closed || 1)) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[var(--gray-600)]">Closed</span>
                <span className="text-[var(--gray-900)] font-medium">{applicationStats.closed}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--gray-100)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--gray-400)]" style={{ width: `${Math.max(5, (applicationStats.closed / (applicationStats.new + applicationStats.interview + applicationStats.offer + applicationStats.closed || 1)) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center justify-between border-b border-[var(--border-light)] px-5 py-4">
          <h3 className="text-sm font-semibold text-[var(--gray-900)]">Recent Applications</h3>
          <Link href="/recruiter/applications" className="text-xs font-medium text-[var(--accent)] hover:underline">
            View All
          </Link>
        </div>
        <div className="divide-y divide-[var(--border-light)]">
          {dashboardData?.recentApplications && dashboardData.recentApplications.length > 0 ? (
            dashboardData.recentApplications.map((app) => (
              <div key={app.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--gray-900)]">
                    {app.candidate?.nickname || app.candidate?.email || "Unknown"}
                  </p>
                  <p className="text-xs text-[var(--gray-500)] mt-0.5">
                    {app.jobOrder?.title || "Unknown Position"}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  app.status === "new" ? "bg-[var(--accent-light)] text-[var(--accent)]" :
                  app.status === "interview" ? "bg-[var(--status-blue-bg)] text-[var(--status-blue-text)]" :
                  app.status === "offer" ? "bg-[var(--status-amber-bg)] text-[var(--status-amber-text)]" :
                  "bg-[var(--gray-100)] text-[var(--gray-600)]"
                }`}>
                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </span>
              </div>
            ))
          ) : (
            <div className="px-5 py-8 text-center text-sm text-[var(--gray-500)]">
              No recent applications
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
