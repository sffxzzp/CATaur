"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ClipboardList, Search, RefreshCw, Download,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { request, requestBlob } from "@/lib/request";
import { toast } from "sonner";

/* ─── Types ───────────────────────────────────────────────────────────────── */
type Actor = { nickname: string; email: string; roles: string[] } | null;

type Log = {
    id: string;
    createdAt: string;
    actor: Actor;
    route: string | null;
    httpMethod: string | null;
    actionType: string | null;
    httpRequestBody: Record<string, unknown> | null;
    ipAddress: string | null;
};

type LogsResponse = {
    data: Log[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function fmtTs(iso: string) {
    const d = new Date(iso);
    return {
        date: d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    };
}

/** Colour a badge based on actionType string content */
function actionStyle(actionType: string): { bg: string; text: string } {
    const t = actionType.toLowerCase();
    if (t.includes("failed") || t.includes("error"))
        return { bg: "bg-[var(--status-red-bg)]", text: "text-[var(--status-red-text)]" };
    if (t.includes("delete"))
        return { bg: "bg-[var(--status-red-bg)]", text: "text-[var(--status-red-text)]" };
    if (t.includes("create") || t.includes("add") || t.includes("send"))
        return { bg: "bg-[var(--status-green-bg)]", text: "text-[var(--status-green-text)]" };
    if (t.includes("update") || t.includes("edit"))
        return { bg: "bg-[var(--status-amber-bg)]", text: "text-[var(--status-amber-text)]" };
    if (t.includes("login") || t.includes("sign"))
        return { bg: "bg-[var(--status-blue-bg)]", text: "text-[var(--status-blue-text)]" };
    return { bg: "bg-[var(--gray-100)]", text: "text-[var(--gray-600)]" };
}

/* ─── SVG chevrons ────────────────────────────────────────────────────────── */
const CHEV = 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")';
const CHEV_SM = `url('data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%239CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="m6 9 6 6 6-6"/%3E%3C/svg%3E')`;

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function AuditLogsPage() {
    const [list, setList] = useState<Log[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query), 400);
        return () => clearTimeout(t);
    }, [query]);

    /* ── GET /admin/audit-logs ── */
    const fetchLogs = useCallback((params: { page: number; limit: number; search?: string }) => {
        setLoading(true);
        const qs = new URLSearchParams();
        qs.set("page", String(params.page));
        qs.set("limit", String(params.limit));
        if (params.search) qs.set("search", params.search);
        request<LogsResponse>(`/admin/audit-logs?${qs.toString()}`)
            .then(res => {
                setList(res.data);
                setTotal(res.total);
                setTotalPages(res.totalPages);
            })
            .catch(err => toast.error(err.message ?? "Failed to load logs."))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        setPage(1);
    }, [debouncedQuery, pageSize]);

    useEffect(() => {
        fetchLogs({ page, limit: pageSize, search: debouncedQuery || undefined });
    }, [page, pageSize, debouncedQuery, fetchLogs]);

    /* ── GET /admin/audit-logs/export ── */
    const handleExport = async () => {
        setExporting(true);
        try {
            const qs = new URLSearchParams();
            if (debouncedQuery) qs.set("search", debouncedQuery);
            const blob = await requestBlob(`/admin/audit-logs/export${qs.toString() ? `?${qs}` : ""}`);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            toast.error(err.message ?? "Export failed.");
        } finally {
            setExporting(false);
        }
    };

    const safePage = Math.min(page, Math.max(1, totalPages));
    const startIdx = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const endIdx = Math.min(safePage * pageSize, total);

    const pageNums = useMemo(() => {
        const pages: (number | "...")[] = [];
        if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
        else {
            pages.push(1);
            if (safePage > 3) pages.push("...");
            for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i);
            if (safePage < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    }, [totalPages, safePage]);

    const navBtn = "flex h-7 w-7 items-center justify-center rounded-md text-[var(--gray-400)] cursor-pointer hover:bg-[var(--gray-100)] disabled:opacity-30 disabled:cursor-not-allowed";

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-5">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--gray-900)]">Audit Logs</h1>
                    <p className="text-sm text-[var(--gray-500)] mt-1">Track admin actions and system events across all users.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={handleExport} disabled={exporting || loading}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--gray-700)] cursor-pointer hover:bg-[var(--gray-50)] transition-colors shadow-[var(--shadow-sm)] disabled:opacity-40 disabled:cursor-not-allowed">
                        <Download className={`h-4 w-4 ${exporting ? "animate-pulse" : ""}`} />
                        {exporting ? "Exporting…" : "Export CSV"}
                    </button>
                    <button
                        onClick={() => fetchLogs({ page, limit: pageSize, search: debouncedQuery || undefined })}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white cursor-pointer hover:bg-[var(--accent-hover)] transition-colors shrink-0">
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                    </button>
                </div>
            </div>

            {/* ── Search ── */}
            <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-400)]" />
                <input
                    placeholder="Search user, action, route, IP…"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] shadow-[var(--shadow-sm)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]"
                />
            </div>

            {/* ── Table ── */}
            <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)]">
                <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-50" : ""}`}>
                    <table className="w-full text-sm min-w-[900px]">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--gray-50)]">
                                <th className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)] px-5 py-2.5 text-left w-44">Timestamp</th>
                                <th className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)] px-5 py-2.5 text-left min-w-[160px]">Actor</th>
                                <th className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)] px-5 py-2.5 text-left hidden sm:table-cell w-24">Role</th>
                                <th className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)] px-5 py-2.5 text-left">Action</th>
                                <th className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)] px-5 py-2.5 text-left hidden md:table-cell">Route</th>
                                <th className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)] px-5 py-2.5 text-left hidden lg:table-cell w-28">Method</th>
                                <th className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)] px-5 py-2.5 text-left hidden md:table-cell w-36">IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.length === 0 && !loading ? (
                                <tr><td colSpan={7} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <ClipboardList className="h-7 w-7 text-[var(--gray-300)]" />
                                        <p className="text-sm text-[var(--gray-500)]">No logs found.</p>
                                    </div>
                                </td></tr>
                            ) : list.map(l => {
                                const { date, time } = fmtTs(l.createdAt);
                                const ac = actionStyle(l.actionType ?? "");
                                const method = l.httpMethod ?? "—";
                                const role = l.actor?.roles?.[0] ?? "—";
                                return (
                                    <tr key={l.id} className="border-b border-[var(--border-light)] last:border-0 hover:bg-[var(--gray-50)] transition-colors">
                                        <td className="px-5 py-3">
                                            <p className="text-xs font-medium text-[var(--gray-700)]">{date}</p>
                                            <p className="text-xs text-[var(--gray-400)]">{time}</p>
                                        </td>
                                        <td className="px-5 py-3">
                                            <p className="text-sm font-medium text-[var(--gray-900)]">{l.actor?.nickname ?? "—"}</p>
                                            <p className="text-xs text-[var(--gray-500)]">{l.actor?.email ?? ""}</p>
                                        </td>
                                        <td className="px-5 py-3 hidden sm:table-cell">
                                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[var(--gray-100)] text-[var(--gray-700)]">{role}</span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ac.bg} ${ac.text}`}>
                                                {l.actionType ?? "—"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-sm text-[var(--gray-700)] hidden md:table-cell max-w-[200px] truncate font-mono">
                                            {l.route ?? "—"}
                                        </td>
                                        <td className="px-5 py-3 hidden lg:table-cell">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium font-mono ${method === "DELETE" ? "bg-[var(--status-red-bg)] text-[var(--status-red-text)]" :
                                                method === "POST" ? "bg-[var(--status-green-bg)] text-[var(--status-green-text)]" :
                                                    method === "PUT" ? "bg-[var(--status-amber-bg)] text-[var(--status-amber-text)]" :
                                                        "bg-[var(--status-blue-bg)] text-[var(--status-blue-text)]"
                                                }`}>
                                                {method}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 font-mono text-xs text-[var(--gray-500)] hidden md:table-cell">{l.ipAddress ?? "—"}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ── */}
                {total > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[var(--border)] px-5 py-3 bg-[var(--surface)]">
                        <div className="flex items-center gap-2 text-xs text-[var(--gray-500)]">
                            <span>Rows</span>
                            <select
                                value={pageSize}
                                onChange={e => setPageSize(Number(e.target.value))}
                                style={{ backgroundImage: CHEV_SM, backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center", backgroundSize: "12px 12px" }}
                                className="h-7 w-[4.5rem] bg-[var(--surface)] appearance-none rounded-md border border-[var(--border)] px-2 pr-6 text-xs font-medium text-[var(--gray-600)] cursor-pointer focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]">
                                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                            <span>
                                <span className="font-medium text-[var(--gray-700)]">{startIdx}–{endIdx}</span>
                                {" "}of{" "}
                                <span className="font-medium text-[var(--gray-700)]">{total}</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setPage(1)} disabled={safePage === 1} className={navBtn}><ChevronsLeft className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className={navBtn}><ChevronLeft className="h-3.5 w-3.5" /></button>
                            {pageNums.map((p, i) => p === "..." ? (
                                <span key={`e${i}`} className="flex h-7 w-7 items-center justify-center text-xs text-[var(--gray-400)]">…</span>
                            ) : (
                                <button key={p} onClick={() => setPage(p as number)}
                                    className={`flex h-7 min-w-[1.75rem] items-center justify-center rounded-md text-xs font-medium transition ${p === safePage ? "bg-[var(--accent)] text-white" : "text-[var(--gray-500)] cursor-pointer hover:bg-[var(--gray-100)]"}`}>
                                    {p}
                                </button>
                            ))}
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className={navBtn}><ChevronRight className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages} className={navBtn}><ChevronsRight className="h-3.5 w-3.5" /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
