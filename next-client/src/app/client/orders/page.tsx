"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { request } from "@/lib/request";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  BriefcaseBusiness,
  Users,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

type StatusFilter = "all" | "active" | "onhold" | "closed";

type APIJobOrder = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  location: string;
  openings: number;
  salary: string;
  tags: string[];
  companyId: string;
  applicants?: number;
};

type APIResponse = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: APIJobOrder[];
};

function getStatusGroup(status: string): "active" | "onhold" | "closed" {
  const s = status.toLowerCase();
  if (s === "filled" || s === "closed") return "closed";
  if (s === "paused" || s === "onhold") return "onhold";
  return "active";
}

const STATUS_STYLE: Record<"active" | "onhold" | "closed", { bg: string; text: string; dot: string; label: string }> = {
  active: { bg: "bg-[var(--status-green-bg)]", text: "text-[var(--status-green-text)]", dot: "bg-[var(--status-green-text)]", label: "Active" },
  onhold: { bg: "bg-[var(--gray-100)]", text: "text-[var(--gray-600)]", dot: "bg-[var(--gray-400)]", label: "On Hold" },
  closed: { bg: "bg-[var(--gray-100)]", text: "text-[var(--gray-600)]", dot: "bg-[var(--gray-400)]", label: "Closed" },
};

const PAGE_SIZE = 10;

export default function ClientOrdersPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [list, setList] = useState<APIJobOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch from API
  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("limit", String(PAGE_SIZE));

    if (statusFilter === "active") {
      ["sourcing", "interview", "offer"].forEach((s) => qs.append("statuses", s));
    } else if (statusFilter === "onhold") {
      qs.append("statuses", "paused");
    } else if (statusFilter === "closed") {
      qs.append("statuses", "filled");
    }

    if (debouncedQuery) {
      qs.set("search", debouncedQuery);
    }

    request<APIResponse>(`/client/orders?${qs.toString()}`)
      .then((res) => {
        setList(res.data || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      })
      .catch((err) => console.error("Error fetching client orders:", err))
      .finally(() => setLoading(false));
  }, [page, statusFilter, debouncedQuery]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--gray-900)] tracking-tight">Job Orders</h2>
          <p className="text-sm text-[var(--gray-500)] mt-1">Track open positions and submitted candidates</p>
        </div>
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-400)]" />
          <Input
            placeholder="Search by title or Req ID…"
            className="h-9 bg-[var(--surface)] pl-9 text-sm border-[var(--border)] rounded-md shadow-[var(--shadow-sm)] text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus-visible:ring-1 focus-visible:ring-[var(--accent-ring)]"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {(["all", "active", "onhold", "closed"] as StatusFilter[]).map((key) => {
          let label = key === "all" ? "All Roles" : key.charAt(0).toUpperCase() + key.slice(1);
          if (key === "onhold") label = "On Hold";
          return (
            <button
              key={key}
              onClick={() => { setStatusFilter(key); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px capitalize ${statusFilter === key
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--gray-500)] cursor-pointer hover:text-[var(--gray-700)]"
                }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)]">
        <div className="overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader className="bg-[var(--gray-50)]">
              <TableRow className="border-b border-[var(--border)] hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)] pl-6 min-w-[220px]">Position</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)]">Location</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)]">Type</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)]">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)] text-right pr-6">Candidates</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center hover:bg-transparent">
                    <div className="flex flex-col items-center gap-2">
                      <BriefcaseBusiness className="h-8 w-8 text-[var(--gray-300)] opacity-50" />
                      <p className="text-sm text-[var(--gray-500)]">Loading job orders...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center hover:bg-transparent">
                    <div className="flex flex-col items-center gap-2">
                      <BriefcaseBusiness className="h-8 w-8 text-[var(--gray-300)]" />
                      <p className="text-sm text-[var(--gray-500)]">No job orders match your filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                (list || []).map((j) => {
                  const safeStatus = j?.status || "active";
                  const group = getStatusGroup(safeStatus);
                  const sc = STATUS_STYLE[group] || STATUS_STYLE.active;

                  return (
                    <TableRow
                      key={j?.id || Math.random().toString()}
                      className="group cursor-pointer border-b border-[var(--border-light)] transition-colors hover:bg-[var(--gray-50)]"
                    >
                      <TableCell className="pl-6 py-4">
                        <Link
                          href={`/client/orders/${encodeURIComponent(j?.id || "")}`}
                          className="text-sm font-semibold text-[var(--gray-900)] hover:text-[var(--accent)] transition-colors"
                        >
                          {j?.title || "Untitled Position"}
                        </Link>
                      </TableCell>
                      <TableCell className="py-4 text-sm text-[var(--gray-600)]">
                        {j?.location || "Unspecified Location"}
                      </TableCell>
                      <TableCell className="py-4 text-sm text-[var(--gray-600)]">
                        Full-time
                      </TableCell>
                      <TableCell className="py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.bg} ${sc.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-right pr-6">
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--gray-700)]">
                          <Users className="h-3.5 w-3.5 text-[var(--gray-400)]" />
                          {j?.openings ?? j?.applicants ?? 0}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination (only render if there's any data) */}
        {total > 0 && (
          <div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-4 bg-[var(--surface)]">
            <p className="text-sm text-[var(--gray-500)]">
              Showing{" "}
              <span className="font-semibold text-[var(--gray-700)]">
                {list.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}
              </span>
              {" "}–{" "}
              <span className="font-semibold text-[var(--gray-700)]">
                {Math.min(page * PAGE_SIZE, total)}
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
                if (totalPages <= 5) pageNum = i + 1;
                else if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;
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
        )}
      </div>
    </div>
  );
}
