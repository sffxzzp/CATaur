"use client";

import { useEffect, useState } from "react";
import { request } from "@/lib/request";
import { Loader2, BriefcaseBusiness, FileText, TrendingUp, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

type JobOrderStats = {
  total: number;
  byStatus: Record<string, number>;
};

type ApplicationStats = {
  total: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
};

type TopJobOrder = {
  id: string;
  title: string;
  status: string;
  applicationCount: number;
};

type ActivityPoint = {
  date: string;
  jobOrders: number;
  applications: number;
};

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [jobOrderStats, setJobOrderStats] = useState<JobOrderStats | null>(null);
  const [applicationStats, setApplicationStats] = useState<ApplicationStats | null>(null);
  const [topJobOrders, setTopJobOrders] = useState<TopJobOrder[]>([]);
  const [activityData, setActivityData] = useState<ActivityPoint[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobOrders, applications, topJobs, activity] = await Promise.all([
          request<JobOrderStats>("/recruiter/reports/job-orders").catch(() => ({ total: 0, byStatus: {} })),
          request<ApplicationStats>("/recruiter/reports/applications").catch(() => ({ total: 0, byStatus: {}, bySource: {} })),
          request<TopJobOrder[]>("/recruiter/reports/top-job-orders?limit=5").catch(() => []),
          request<ActivityPoint[]>("/recruiter/reports/activity?days=30").catch(() => []),
        ]);

        setJobOrderStats(jobOrders);
        setApplicationStats(applications);
        setTopJobOrders(topJobs);
        setActivityData(activity);
      } catch (err) {
        console.error("Failed to load reports", err);
        toast.error("Failed to load reports.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ["Metric", "Value"],
      ["Total Job Orders", jobOrderStats?.total || 0],
      ["Total Applications", applicationStats?.total || 0],
      ["Avg Applications per Job", avgApplicationsPerJob],
      ["Conversion Rate", `${conversionRate}%`],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Summary");

    // Job Orders by Status
    const jobStatusData = [["Status", "Count"], ...Object.entries(jobOrderStats?.byStatus || {})];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(jobStatusData), "Job Orders by Status");

    // Applications by Status
    const appStatusData = [["Status", "Count"], ...Object.entries(applicationStats?.byStatus || {})];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(appStatusData), "Applications by Status");

    // Applications by Source
    const appSourceData = [["Source", "Count"], ...Object.entries(applicationStats?.bySource || {}).map(([k, v]) => [k === 'self_applied' ? 'Self Applied' : 'Recruiter Import', v])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(appSourceData), "Applications by Source");

    // Top Job Orders
    const topJobsData = [["Position", "Status", "Applications"], ...topJobOrders.map(j => [j.title, j.status, j.applicationCount])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(topJobsData), "Top Job Orders");

    // Activity Timeline
    const activityTimelineData = [["Date", "Job Orders", "Applications"], ...activityData.map(a => [a.date, a.jobOrders, a.applications])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(activityTimelineData), "Activity Timeline");

    XLSX.writeFile(wb, `reports-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  const avgApplicationsPerJob = jobOrderStats?.total ? Math.round((applicationStats?.total || 0) / jobOrderStats.total) : 0;
  const conversionRate = applicationStats?.total ? Math.round(((applicationStats.byStatus.offer || 0) / applicationStats.total) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--gray-900)]">Reports & Analytics</h2>
          <p className="text-sm text-[var(--gray-500)] mt-0.5">Performance metrics, pipeline health, and recruitment insights</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-md bg-[var(--accent)] px-3.5 py-2 text-sm font-medium text-white cursor-pointer hover:bg-[var(--accent-hover)] transition-colors self-start"
        >
          <Download className="h-4 w-4" />
          Export Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--gray-50)]">
            <BriefcaseBusiness className="h-4 w-4 text-[var(--gray-500)]" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-semibold text-[var(--gray-900)] tracking-tight">{jobOrderStats?.total || 0}</h3>
            <p className="text-xs text-[var(--gray-500)] mt-1">Total Job Orders</p>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--gray-50)]">
            <FileText className="h-4 w-4 text-[var(--gray-500)]" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-semibold text-[var(--gray-900)] tracking-tight">{applicationStats?.total || 0}</h3>
            <p className="text-xs text-[var(--gray-500)] mt-1">Total Applications</p>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--gray-50)]">
            <TrendingUp className="h-4 w-4 text-[var(--gray-500)]" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-semibold text-[var(--gray-900)] tracking-tight">{avgApplicationsPerJob}</h3>
            <p className="text-xs text-[var(--gray-500)] mt-1">Avg Apps per Job</p>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--gray-50)]">
            <TrendingUp className="h-4 w-4 text-[var(--gray-500)]" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-semibold text-[var(--gray-900)] tracking-tight">{conversionRate}%</h3>
            <p className="text-xs text-[var(--gray-500)] mt-1">Conversion Rate</p>
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
            {Object.entries(jobOrderStats?.byStatus || {}).map(([status, count]) => (
              <div key={status}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[var(--gray-600)] capitalize">{status}</span>
                  <span className="text-[var(--gray-900)] font-medium">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--gray-100)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${Math.max(5, (count / (jobOrderStats?.total || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Applications by Status */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border-light)] px-5 py-4">
            <h3 className="text-sm font-semibold text-[var(--gray-900)]">Applications by Status</h3>
          </div>
          <div className="p-5 space-y-4">
            {Object.entries(applicationStats?.byStatus || {}).map(([status, count]) => (
              <div key={status}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[var(--gray-600)] capitalize">{status}</span>
                  <span className="text-[var(--gray-900)] font-medium">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--gray-100)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--status-blue-text)]"
                    style={{ width: `${Math.max(5, (count / (applicationStats?.total || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Applications by Source */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <div className="border-b border-[var(--border-light)] px-5 py-4">
          <h3 className="text-sm font-semibold text-[var(--gray-900)]">Applications by Source</h3>
        </div>
        <div className="p-5 space-y-4">
          {Object.entries(applicationStats?.bySource || {}).map(([source, count]) => (
            <div key={source}>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[var(--gray-600)]">{source === 'self_applied' ? 'Self Applied' : 'Recruiter Import'}</span>
                <span className="text-[var(--gray-900)] font-medium">{count}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--gray-100)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--status-green-text)]"
                  style={{ width: `${Math.max(5, (count / (applicationStats?.total || 1)) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Job Orders */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <div className="border-b border-[var(--border-light)] px-5 py-4">
          <h3 className="text-sm font-semibold text-[var(--gray-900)]">Top Job Orders by Applications</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-light)] text-xs font-medium uppercase tracking-wider text-[var(--gray-400)]">
                <th className="px-5 py-3 text-left">Position</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Applications</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)]">
              {topJobOrders.length > 0 ? (
                topJobOrders.map((job) => (
                  <tr key={job.id}>
                    <td className="px-5 py-3 text-[var(--gray-900)] font-medium">{job.title}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[var(--accent-light)] text-[var(--accent)] capitalize">
                        {job.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-[var(--gray-900)] font-medium">{job.applicationCount}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-sm text-[var(--gray-500)]">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <div className="border-b border-[var(--border-light)] px-5 py-4">
          <h3 className="text-sm font-semibold text-[var(--gray-900)]">Activity Timeline (Last 30 Days)</h3>
        </div>
        <div className="p-5">
          {activityData.length > 0 ? (
            <div className="space-y-2">
              {activityData.slice(-10).map((point) => (
                <div key={point.date} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--gray-600)]">{new Date(point.date).toLocaleDateString()}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-[var(--gray-500)]">Jobs: <span className="font-medium text-[var(--gray-900)]">{point.jobOrders}</span></span>
                    <span className="text-[var(--gray-500)]">Apps: <span className="font-medium text-[var(--gray-900)]">{point.applications}</span></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-[var(--gray-500)] py-8">No activity data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
