"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { jobOrdersClient } from "@/lib/api/jobOrders";
import { companiesClient } from "@/lib/api/companies";
import type { JobOrder, Company } from "@/lib/api/types";
import { toast } from "sonner";
import { LocationSelector } from "@/components/location-selector";
import {
  Search,
  Plus,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  CircleCheck,
  PauseCircle,
  Users,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type JobOrderWithCompany = JobOrder & {
  company?: Company;
  applicants?: number;
};

type StatusGroup = "all" | "active" | "onhold" | "full";

function getStatusGroup(status: string): "active" | "onhold" | "full" {
  if (status === "filled") return "full";
  if (status === "paused") return "onhold";
  return "active";
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  active: { label: "Active", bg: "bg-[var(--status-green-bg)]", text: "text-[var(--status-green-text)]", dot: "bg-[var(--status-green-text)]" },
  sourcing: { label: "Sourcing", bg: "bg-[var(--status-blue-bg)]", text: "text-[var(--status-blue-text)]", dot: "bg-[var(--status-blue-text)]" },
  interview: { label: "Interview", bg: "bg-[var(--status-amber-bg)]", text: "text-[var(--status-amber-text)]", dot: "bg-[var(--status-amber-text)]" },
  offer: { label: "Offer", bg: "bg-[var(--status-green-bg)]", text: "text-[var(--status-green-text)]", dot: "bg-[var(--status-green-text)]" },
  filled: { label: "Closed", bg: "bg-[var(--gray-100)]", text: "text-[var(--gray-600)]", dot: "bg-[var(--gray-400)]" },
  paused: { label: "On Hold", bg: "bg-[var(--gray-100)]", text: "text-[var(--gray-600)]", dot: "bg-[var(--gray-400)]" },
};

const priorityConfig: Record<string, { label: string; dot: string; text: string }> = {
  high: { label: "High", dot: "bg-[var(--status-red-text)]", text: "text-[var(--status-red-text)]" },
  medium: { label: "Medium", dot: "bg-[var(--status-amber-text)]", text: "text-[var(--status-amber-text)]" },
  low: { label: "Low", dot: "bg-[var(--gray-400)]", text: "text-[var(--gray-500)]" },
};

export default function RecruiterJobOrdersPage() {
  const [query, setQuery] = useState("");
  const [statusGroup, setStatusGroup] = useState<StatusGroup>("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [jobs, setJobs] = useState<JobOrderWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [companies, setCompanies] = useState<Record<string, Company>>({});

  // Filter states
  const [filterCompanyId, setFilterCompanyId] = useState("");
  const [filterEmploymentType, setFilterEmploymentType] = useState("");
  const [filterWorkArrangement, setFilterWorkArrangement] = useState("");

  // Status Confirmation Modal State
  const [statusConfirmModal, setStatusConfirmModal] = useState<{
    isOpen: boolean;
    jobId: string;
    jobTitle: string;
    newStatus: string;
  }>({
    isOpen: false,
    jobId: "",
    jobTitle: "",
    newStatus: "active"
  });

  // Delete Confirmation Modal State
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    jobId: string;
    jobTitle: string;
  }>({
    isOpen: false,
    jobId: "",
    jobTitle: ""
  });

  // Edit Modal State
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    job: JobOrderWithCompany | null;
  }>({
    isOpen: false,
    job: null
  });

  const [editForm, setEditForm] = useState({
    title: "",
    companyId: "",
    country: "",
    state: "",
    city: "",
    department: "",
    salary: "",
    openings: 1,
    employmentType: "Full-time",
    workArrangement: "Remote",
    description: "",
    priority: "medium",
  });

  const [submitting, setSubmitting] = useState(false);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);

  useEffect(() => {
    loadData();
    loadAllCompanies();
  }, [page, query, statusGroup, filterCompanyId, filterEmploymentType, filterWorkArrangement]);

  const loadAllCompanies = async () => {
    try {
      const response = await companiesClient.list({ page: 1, limit: 100 });
      setAllCompanies(response.data);
    } catch (error) {
      console.error("Failed to load companies:", error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Map statusGroup to API status filter
      let statusFilter: string | undefined;
      if (statusGroup === "active") {
        statusFilter = "sourcing,interview,offer,active";
      } else if (statusGroup === "onhold") {
        statusFilter = "paused";
      } else if (statusGroup === "full") {
        statusFilter = "filled";
      }

      const response = await jobOrdersClient.list({
        page,
        limit: pageSize,
        status: statusFilter,
        search: query || undefined,
        companyId: filterCompanyId || undefined,
        employmentType: filterEmploymentType || undefined,
        workArrangement: filterWorkArrangement || undefined,
      });

      setJobs(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);

      // Load companies for job orders
      const companyIds = [...new Set(response.data.map(j => j.companyId).filter(Boolean))];
      if (companyIds.length > 0) {
        const companiesMap: Record<string, Company> = {};
        for (const companyId of companyIds) {
          try {
            const company = await companiesClient.getById(companyId as string);
            companiesMap[companyId as string] = company;
          } catch (err) {
            console.error(`Failed to load company ${companyId}:`, err);
          }
        }
        setCompanies(companiesMap);
      }
    } catch (error) {
      console.error("Failed to load job orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChangeClick = (jobId: string, jobTitle: string, newStatus: string) => {
    setStatusConfirmModal({
      isOpen: true,
      jobId,
      jobTitle,
      newStatus
    });
  };

  const confirmStatusChange = async () => {
    const { jobId, newStatus } = statusConfirmModal;

    try {
      await jobOrdersClient.update(jobId, { status: newStatus });
      setStatusConfirmModal({ isOpen: false, jobId: "", jobTitle: "", newStatus: "active" });
      loadData(); // Reload data
      toast.success("Status updated successfully.");
    } catch (error) {
      console.error("Failed to update job order status:", error);
      toast.error("Failed to update status. Please try again.");
    }
  };

  const handleDeleteClick = (jobId: string, jobTitle: string) => {
    setDeleteConfirmModal({
      isOpen: true,
      jobId,
      jobTitle
    });
  };

  const confirmDelete = async () => {
    const { jobId, jobTitle } = deleteConfirmModal;

    try {
      await jobOrdersClient.delete(jobId);
      setDeleteConfirmModal({ isOpen: false, jobId: "", jobTitle: "" });
      toast.success(`Job order "${jobTitle}" deleted successfully`);
      loadData(); // Reload data
    } catch (error) {
      console.error("Failed to delete job order:", error);
      toast.error("Failed to delete job order. Please try again.");
    }
  };

  const handleEditClick = (job: JobOrderWithCompany) => {
    // Use the location fields directly
    const country = job.locationCountry || "";
    const state = job.locationState || "";
    const city = job.locationCity || "";

    setEditForm({
      title: job.title,
      companyId: job.companyId || "",
      country,
      state,
      city,
      department: job.tags?.[0] || "",
      salary: job.salary || "",
      openings: job.openings || 1,
      employmentType: job.employmentType || "Full-time",
      workArrangement: job.workArrangement || "Remote",
      description: job.description || "",
      priority: job.priority || "medium",
    });
    setEditModal({ isOpen: true, job });
  };

  const handleEditSubmit = async () => {
    if (!editModal.job || !editForm.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSubmitting(true);
    try {
      await jobOrdersClient.update(editModal.job.id, {
        title: editForm.title.trim(),
        companyId: editForm.companyId || undefined,
        salary: editForm.salary.trim() || undefined,
        openings: Number(editForm.openings) || 1,
        priority: editForm.priority,
        description: editForm.description.trim() || undefined,
        employmentType: editForm.employmentType || undefined,
        workArrangement: editForm.workArrangement || undefined,
        tags: editForm.department ? [editForm.department] : undefined,
        locationCountry: editForm.country || undefined,
        locationState: editForm.state || undefined,
        locationCity: editForm.city || undefined,
      });

      setEditModal({ isOpen: false, job: null });
      loadData(); // Reload data
      toast.success("Job order updated successfully.");
    } catch (error) {
      console.error("Failed to update job order:", error);
      toast.error("Failed to update job order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    // These would ideally come from a separate API endpoint
    return {
      total: total,
      active: jobs.filter((j) => getStatusGroup(j.status) === "active").length,
      onHold: jobs.filter((j) => getStatusGroup(j.status) === "onhold").length,
      filled: jobs.filter((j) => getStatusGroup(j.status) === "full").length,
    };
  }, [jobs, total]);

  return (
    <div className="p-6 md:p-8 space-y-6 md:space-y-8">
      {/* Header & Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-[var(--gray-900)] tracking-tight">Job Orders</h2>
            <p className="text-sm text-[var(--gray-500)] mt-1">Manage and track all open requisitions</p>
          </div>
          <Button size="sm" className="h-9 gap-2 shrink-0 bg-[var(--accent)] text-white shadow-[var(--shadow-sm)] cursor-pointer hover:bg-[var(--accent-hover)]" asChild>
            <Link href="/recruiter/job-orders/new">
              <Plus className="h-4 w-4" />
              New Job Order
            </Link>
          </Button>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-400)]" />
            <Input
              placeholder="Search title"
              className="h-9 bg-[var(--surface)] pl-9 text-sm border-[var(--border)] rounded-md shadow-[var(--shadow-sm)] text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus-visible:ring-1 focus-visible:ring-[var(--accent-ring)]"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="h-9 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 pr-8 text-sm text-[var(--gray-700)] shadow-[var(--shadow-sm)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] appearance-none relative"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", backgroundSize: "1em" }}
            value={statusGroup}
            onChange={(e) => { setStatusGroup(e.target.value as StatusGroup); setPage(1); }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="onhold">On Hold</option>
            <option value="full">Closed</option>
          </select>
          <select
            className="h-9 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 pr-8 text-sm text-[var(--gray-700)] shadow-[var(--shadow-sm)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] appearance-none relative"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", backgroundSize: "1em" }}
            value={filterCompanyId}
            onChange={(e) => { setFilterCompanyId(e.target.value); setPage(1); }}
          >
            <option value="">All Companies</option>
            {allCompanies.map((company) => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 pr-8 text-sm text-[var(--gray-700)] shadow-[var(--shadow-sm)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] appearance-none relative"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", backgroundSize: "1em" }}
            value={filterEmploymentType}
            onChange={(e) => { setFilterEmploymentType(e.target.value); setPage(1); }}
          >
            <option value="">All Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Temporary">Temporary</option>
            <option value="Internship">Internship</option>
            <option value="Permanent">Permanent</option>
          </select>
          <select
            className="h-9 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 pr-8 text-sm text-[var(--gray-700)] shadow-[var(--shadow-sm)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] appearance-none relative"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", backgroundSize: "1em" }}
            value={filterWorkArrangement}
            onChange={(e) => { setFilterWorkArrangement(e.target.value); setPage(1); }}
          >
            <option value="">All Arrangements</option>
            <option value="Remote">Remote</option>
            <option value="Onsite">Onsite</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)]">
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-[var(--gray-50)]">
              <TableRow className="border-b border-[var(--border)] hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)] pl-6 min-w-[200px]">Title</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)]">Company</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)]">Location</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)]">Type</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)]">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)]">Owner</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)]">Created</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)] text-right pr-6 w-[120px]">Applicants</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)] text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center cursor-pointer hover:bg-transparent">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-[var(--gray-300)]" />
                      <p className="text-sm text-[var(--gray-500)]">Loading job orders...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center cursor-pointer hover:bg-transparent">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-[var(--gray-300)]" />
                      <p className="text-sm text-[var(--gray-500)]">No job orders match your filters.</p>
                      <p className="text-xs text-[var(--gray-400)]">Try adjusting your search or filter criteria.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((j) => {
                  const company = j.companyId ? companies[j.companyId] : null;
                  const pc = priorityConfig[j.priority] ?? priorityConfig.medium;

                  // Consolidate status for display in dropdown
                  const unifiedStatus = ["sourcing", "interview", "offer", "active"].includes(j.status) ? "active" : j.status === "paused" ? "paused" : "filled";
                  const sc = statusConfig[unifiedStatus] ?? statusConfig.active;

                  return (
                    <TableRow key={j.id} className="group cursor-pointer border-b border-[var(--border-light)] transition-colors hover:bg-[var(--gray-50)]">
                      <TableCell className="pl-6 py-4">
                        <Link href={`/recruiter/job-orders/${encodeURIComponent(j.id)}`} className="text-sm font-semibold text-[var(--gray-900)] hover:text-[var(--accent)] transition-colors">
                          {j.title}
                        </Link>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm text-[var(--gray-700)]">{company?.name || "-"}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm text-[var(--gray-600)]">{j.location || "-"}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm text-[var(--gray-600)]">{j.employmentType || "Full-time"}</span>
                      </TableCell>
                      <TableCell className="py-4 relative">
                        <select
                          className={`appearance-none cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] ${sc.bg} ${sc.text} transition-colors border-none`}
                          style={{
                            paddingRight: "1.5rem",
                            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(sc.dot.includes('green') ? '#166534' : sc.dot.includes('amber') ? '#92400e' : sc.dot.includes('blue') ? '#1e40af' : '#4b5563')}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 0.35rem center",
                            backgroundSize: "0.8em"
                          }}
                          value={unifiedStatus}
                          onChange={(e) => {
                            e.stopPropagation();
                            const value = e.target.value;
                            const newStatus = value === "filled" ? "filled" : value === "paused" ? "paused" : "active";
                            if (newStatus !== unifiedStatus) {
                              handleStatusChangeClick(j.id, j.title, newStatus);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="active">Active</option>
                          <option value="paused">On Hold</option>
                          <option value="filled">Closed</option>
                        </select>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm text-[var(--gray-700)]">{j.owner || "-"}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm text-[var(--gray-600)]">
                          {new Date(j.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-right pr-6">
                        <span className="inline-flex items-center justify-center font-medium text-sm text-[var(--gray-900)]">
                          {j.applicants || 0}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 border-l border-transparent">
                        <div className="flex items-center justify-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(j);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--gray-500)] cursor-pointer hover:text-[var(--accent)] hover:bg-[var(--accent-light)] transition"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(j.id, j.title);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--gray-500)] cursor-pointer hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>

                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-4 bg-[var(--surface)]">
          <p className="text-sm text-[var(--gray-500)]">
            Showing{" "}
            <span className="font-semibold text-[var(--gray-700)]">
              {jobs.length > 0 ? (page - 1) * pageSize + 1 : 0}
            </span>
            {" "}to{" "}
            <span className="font-semibold text-[var(--gray-700)]">
              {Math.min(page * pageSize, total)}
            </span>
            {" "}of{" "}
            <span className="font-semibold text-[var(--gray-700)]">{total}</span>
            {" "}results
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--gray-500)] transition-colors cursor-pointer hover:bg-[var(--gray-50)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors ${page === pageNum
                    ? "bg-[var(--accent)] text-white border border-[var(--accent)]"
                    : "border border-[var(--border)] bg-[var(--surface)] text-[var(--gray-600)] cursor-pointer hover:bg-[var(--gray-50)]"
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--gray-500)] transition-colors cursor-pointer hover:bg-[var(--gray-50)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      {/* Status Confirmation Modal */}
      {statusConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-md rounded-xl bg-[var(--surface)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-[var(--gray-900)]">
                <AlertCircle className="h-5 w-5 text-[var(--status-amber-text)]" />
                Confirm Status Change
              </div>
              <button
                onClick={() => setStatusConfirmModal({ ...statusConfirmModal, isOpen: false })}
                className="rounded-md text-[var(--gray-400)] hover:text-[var(--gray-600)] hover:bg-[var(--gray-100)] p-1.5 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-sm text-[var(--gray-600)]">
                Are you sure you want to change the status of <strong>{statusConfirmModal.jobTitle}</strong> to <strong>{statusConfig[statusConfirmModal.newStatus]?.label || statusConfirmModal.newStatus}</strong>?
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--gray-50)] px-6 py-4">
              <button
                onClick={() => setStatusConfirmModal({ ...statusConfirmModal, isOpen: false })}
                className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--gray-700)] shadow-[var(--shadow-sm)] hover:bg-[var(--gray-50)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                className="rounded-md border border-transparent bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-sm)] hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-3xl rounded-xl bg-[var(--surface)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <h2 className="text-lg font-semibold text-[var(--gray-900)]">Edit Job Order</h2>
              <button
                onClick={() => setEditModal({ isOpen: false, job: null })}
                className="rounded-md text-[var(--gray-400)] hover:text-[var(--gray-600)] hover:bg-[var(--gray-100)] p-1.5 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-[var(--gray-700)]">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--gray-700)]">Company</label>
                  <select
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] cursor-pointer"
                    value={editForm.companyId}
                    onChange={(e) => setEditForm({ ...editForm, companyId: e.target.value })}
                  >
                    <option value="">Select a company</option>
                    {allCompanies.map((company) => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--gray-700)]">Priority</label>
                  <select
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] cursor-pointer"
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--gray-700)]">Location (Country / State / City)</label>
                <LocationSelector
                  country={editForm.country}
                  state={editForm.state}
                  city={editForm.city}
                  onCountryChange={(c) => setEditForm({ ...editForm, country: c, state: "", city: "" })}
                  onStateChange={(s) => setEditForm({ ...editForm, state: s, city: "" })}
                  onCityChange={(c) => setEditForm({ ...editForm, city: c })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--gray-700)]">Department</label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    placeholder="e.g., Engineering"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--gray-700)]">Salary</label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]"
                    value={editForm.salary}
                    onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })}
                    placeholder="e.g., $120k - $150k"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--gray-700)]">Openings</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]"
                    value={editForm.openings}
                    onChange={(e) => setEditForm({ ...editForm, openings: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--gray-700)]">Type</label>
                  <select
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] cursor-pointer"
                    value={editForm.employmentType}
                    onChange={(e) => setEditForm({ ...editForm, employmentType: e.target.value })}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Temporary">Temporary</option>
                    <option value="Internship">Internship</option>
                    <option value="Permanent">Permanent</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-[var(--gray-700)]">Work Arrangement</label>
                  <select
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] cursor-pointer"
                    value={editForm.workArrangement}
                    onChange={(e) => setEditForm({ ...editForm, workArrangement: e.target.value })}
                  >
                    <option value="Remote">Remote</option>
                    <option value="Onsite">Onsite</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--gray-700)]">Description</label>
                <textarea
                  className="w-full min-h-[200px] resize-y rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Job description..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--gray-50)] px-6 py-4">
              <button
                onClick={() => setEditModal({ isOpen: false, job: null })}
                disabled={submitting}
                className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--gray-700)] shadow-[var(--shadow-sm)] hover:bg-[var(--gray-50)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={submitting}
                className="rounded-md border border-transparent bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-sm)] hover:bg-[var(--accent-hover)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-md rounded-xl bg-[var(--surface)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-[var(--gray-900)]">
                <AlertCircle className="h-5 w-5 text-[var(--danger)]" />
                Confirm Delete
              </div>
              <button
                onClick={() => setDeleteConfirmModal({ ...deleteConfirmModal, isOpen: false })}
                className="rounded-md text-[var(--gray-400)] hover:text-[var(--gray-600)] hover:bg-[var(--gray-100)] p-1.5 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-sm text-[var(--gray-600)]">
                Are you sure you want to delete <strong>{deleteConfirmModal.jobTitle}</strong>? This action cannot be undone.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--gray-50)] px-6 py-4">
              <button
                onClick={() => setDeleteConfirmModal({ ...deleteConfirmModal, isOpen: false })}
                className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--gray-700)] shadow-[var(--shadow-sm)] hover:bg-[var(--gray-50)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-md border border-transparent bg-[var(--danger)] px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-sm)] hover:bg-[var(--danger-hover)] transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
