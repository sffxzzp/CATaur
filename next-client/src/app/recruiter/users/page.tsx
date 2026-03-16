"use client";

import { useEffect, useMemo, useState } from "react";
import { request } from "@/lib/request";
import {
    Plus, Search, Pencil, Trash2,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    X, Users2,
} from "lucide-react";
import { toast } from "sonner";
import UserFormModal, { type ModalState, type UserFormData, type Role } from "./user-form-modal";

/* ─── Types ───────────────────────────────────────────────────────────────── */
type Status = "active" | "disabled";

type User = {
    id: string;
    nickname: string;
    email: string;
    phone: string | null;
    roles: { userId: string; role: Role }[];
    isActive: boolean;
    createdAt: string;
    password?: string;
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short", day: "2-digit", year: "numeric",
    });
}

function initials(name: string) {
    return name.trim().split(/\s+/).map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

/* ─── Role badge colours ──────────────────────────────────────────────────── */
const ROLE_STYLE: Record<Role, { bg: string; text: string }> = {
    Admin: { bg: "bg-[var(--gray-100)]", text: "text-[var(--gray-700)]" },
    Recruiter: { bg: "bg-[var(--gray-100)]", text: "text-[var(--gray-700)]" },
    Client: { bg: "bg-[var(--gray-100)]", text: "text-[var(--gray-700)]" },
};

/* ─── Chevron SVG for <select> ────────────────────────────────────────────── */
const CHEV = 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")';
const CHEV_SM = `url('data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%239CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="m6 9 6 6 6-6"/%3E%3C/svg%3E')`;

/* ─── API types ──────────────────────────────────────────────────────────── */
type UsersResponse = { data: User[]; total: number; page: number; limit: number; totalPages: number };

type FetchParams = { page: number; limit: number; role?: Role; search?: string };

async function fetchUsers(params: FetchParams): Promise<UsersResponse> {
    const qs = new URLSearchParams();
    qs.set("page", String(params.page));
    qs.set("limit", String(params.limit));
    if (params.role) qs.set("role", params.role);
    if (params.search) qs.set("search", params.search);
    return request<UsersResponse>(`/admin/users?${qs.toString()}`);
}

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function UsersPage() {
    const [modalState, setModalState] = useState<ModalState>(null);
    const [list, setList] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    const [query, setQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);

    // debounced search so we don't fire on every keystroke
    const [debouncedQuery, setDebouncedQuery] = useState("");
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(t);
    }, [query]);

    // re-fetch whenever page / pageSize / role / search changes
    useEffect(() => {
        setLoading(true);
        fetchUsers({
            page,
            limit: pageSize,
            role: roleFilter === "all" ? undefined : roleFilter,
            search: debouncedQuery || undefined,
        })
            .then((res) => {
                setList(res.data);
                setTotal(res.total);
                setTotalPages(res.totalPages);
            })
            .catch((err) => console.error("Failed to fetch users:", err))
            .finally(() => setLoading(false));
    }, [page, pageSize, roleFilter, debouncedQuery]);

    const safePage = Math.min(page, totalPages);
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


    // Delete confirm
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

    /* ── create / edit via API ── */
    const handleSaved = async (data: UserFormData, editingId?: string) => {
        const body = {
            accountName: data.accountName,
            role: data.role,
            email: data.email,
            phone: data.phone || null,
            password: data.password || undefined,
            isActive: data.status === "active",
        };

        try {
            if (editingId) {
                // PUT /admin/users/:id  — edit existing user
                await request(`/admin/users/${editingId}`, { method: "PUT", json: body });
            } else {
                // POST /admin/users  — create new user
                await request("/admin/users", { method: "POST", json: body });
            }
            // Refresh the current page from the server so the list stays in sync
            setLoading(true);
            await fetchUsers({ page, limit: pageSize, role: roleFilter === "all" ? undefined : roleFilter, search: debouncedQuery || undefined })
                .then(res => {
                    setList(res.data);
                    setTotal(res.total);
                    setTotalPages(res.totalPages);
                })
                .catch(err => console.error("Refresh failed:", err))
                .finally(() => setLoading(false));

            toast.success(editingId ? "User updated successfully" : "User created successfully");
        } catch (err: any) {
            // Rethrow so the modal can catch it and display the error banner
            throw err;
        }
    };

    /* ── delete ── */
    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await request(`/admin/users/${deleteTarget.id}`, { method: "DELETE" });
            setDeleteTarget(null);
            // Refresh list from server
            setLoading(true);
            fetchUsers({ page, limit: pageSize, role: roleFilter === "all" ? undefined : roleFilter, search: debouncedQuery || undefined })
                .then(res => { setList(res.data); setTotal(res.total); setTotalPages(res.totalPages); })
                .catch(err => console.error("Refresh failed:", err))
                .finally(() => setLoading(false));
            toast.success("User deleted successfully.");
        } catch (err: any) {
            toast.error(err.message ?? "Failed to delete user.");
        }
    };

    /* ── shared class shortcuts ── */
    const navBtn = "flex h-7 w-7 items-center justify-center rounded-md text-[var(--gray-400)] cursor-pointer hover:bg-[var(--gray-100)] disabled:opacity-30 disabled:cursor-not-allowed";

    /* ─────────────────────────── RENDER ─────────────────────────────────── */
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-5">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--gray-900)]">User Management</h1>
                    <p className="text-sm text-[var(--gray-500)] mt-1">Create, edit, and manage user accounts and permissions.</p>
                </div>
                <button onClick={() => setModalState({ mode: "add" })}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white cursor-pointer hover:bg-[var(--accent-hover)] transition-colors shrink-0">
                    <Plus className="h-4 w-4" /> Add User
                </button>
            </div>

            {/* ── Search + Role filter ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative w-full sm:w-64">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-400)]" />
                    <input
                        placeholder="Search name, email…"
                        value={query}
                        onChange={e => { setQuery(e.target.value); setPage(1); }}
                        className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] shadow-[var(--shadow-sm)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={e => { setRoleFilter(e.target.value as "all" | Role); setPage(1); }}
                    style={{ backgroundImage: CHEV, backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", backgroundSize: "1em" }}
                    className="h-9 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 pr-8 text-sm text-[var(--gray-700)] shadow-[var(--shadow-sm)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] appearance-none">
                    <option value="all">All Roles</option>
                    <option value="Recruiter">Recruiter</option>
                    <option value="Client">Client</option>
                    <option value="Admin">Admin</option>
                </select>
            </div>

            {/* ── Table ── */}
            <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)]">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[700px]">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--gray-50)]">
                                <th className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)] px-5 py-2.5 text-left min-w-[220px]">Account</th>
                                <th className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)] px-5 py-2.5 text-left">Phone</th>
                                <th className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)] px-5 py-2.5 text-left">Role</th>
                                <th className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)] px-5 py-2.5 text-left">Status</th>
                                <th className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)] px-5 py-2.5 text-left hidden md:table-cell">Created</th>
                                <th className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)] px-5 py-2.5 text-center w-28">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.length === 0 ? (
                                <tr><td colSpan={6} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Users2 className="h-7 w-7 text-[var(--gray-300)]" />
                                        <p className="text-sm text-[var(--gray-500)]">{loading ? "Loading…" : "No users match your filters."}</p>
                                    </div>
                                </td></tr>
                            ) : list.map((u: User) => {
                                const rc = ROLE_STYLE[u.roles[0]?.role ?? "Recruiter"] ?? ROLE_STYLE["Recruiter"];
                                return (
                                    <tr key={u.id} className="group border-b border-[var(--border-light)] last:border-0 hover:bg-[var(--gray-50)] transition-colors cursor-pointer">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--gray-100)] text-[11px] font-semibold text-[var(--gray-600)]">
                                                    {initials(u.nickname)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-[var(--gray-900)]">{u.nickname}</p>
                                                    <p className="text-xs text-[var(--gray-500)]">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-sm text-[var(--gray-600)]">{u.phone || "—"}</td>
                                        <td className="px-5 py-3">
                                            <span className={`inline - flex items - center rounded - full px - 2 py - 0.5 text - xs font - medium ${rc.bg} ${rc.text} `}>{u.roles[0]?.role ?? "—"}</span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`inline - flex items - center gap - 1.5 text - xs font - medium ${u.isActive ? "text-[var(--status-green-text)]" : "text-[var(--gray-500)]"} `}>
                                                <span className={`h - 1.5 w - 1.5 rounded - full ${u.isActive ? "bg-[var(--status-green-text)]" : "bg-[var(--gray-400)]"} `} />
                                                {u.isActive ? "Active" : "Disabled"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-sm text-[var(--gray-500)] hidden md:table-cell">{fmtDate(u.createdAt)}</td>
                                        <td className="px-5 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setModalState({ mode: "edit", user: u })} title="Edit"
                                                    className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--gray-500)] cursor-pointer hover:text-[var(--accent)] hover:bg-[var(--accent-light)] transition">
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => setDeleteTarget(u)} title="Delete"
                                                    className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--gray-500)] cursor-pointer hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] transition">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
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
                            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                                style={{ backgroundImage: CHEV_SM, backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center", backgroundSize: "12px 12px" }}
                                className="h-7 w-[4.5rem] bg-[var(--surface)] appearance-none rounded-md border border-[var(--border)] px-2 pr-6 text-xs font-medium text-[var(--gray-600)] cursor-pointer focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]">
                                {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
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
                                <span key={`e${i} `} className="flex h-7 w-7 items-center justify-center text-xs text-[var(--gray-400)]">…</span>
                            ) : (
                                <button key={p} onClick={() => setPage(p as number)}
                                    className={`flex h - 7 min - w - [1.75rem] items - center justify - center rounded - md text - xs font - medium transition ${p === safePage ? "bg-[var(--accent)] text-white" : "text-[var(--gray-500)] cursor-pointer hover:bg-[var(--gray-100)]"} `}>
                                    {p}
                                </button>
                            ))}
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className={navBtn}><ChevronRight className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages} className={navBtn}><ChevronsRight className="h-3.5 w-3.5" /></button>
                        </div>
                    </div>
                )}
            </div>

            <UserFormModal
                state={modalState}
                onClose={() => setModalState(null)}
                onSaved={handleSaved}
            />

            {/* ═══════════════════ DELETE CONFIRM ═══════════════════ */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="relative w-full max-w-sm rounded-xl bg-[var(--surface)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
                            <h2 className="text-lg font-semibold text-[var(--gray-900)]">Delete User</h2>
                            <button onClick={() => setDeleteTarget(null)} className="rounded-md text-[var(--gray-400)] hover:text-[var(--gray-600)] hover:bg-[var(--gray-100)] p-1.5 transition">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-1">
                            <p className="text-sm text-[var(--gray-700)]">
                                Are you sure you want to delete{" "}
                                <strong className="text-[var(--gray-900)]">{deleteTarget.nickname}</strong>?
                            </p>
                            <p className="text-xs text-[var(--gray-500)]">This action cannot be undone.</p>
                        </div>
                        <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--gray-50)] px-6 py-4">
                            <button onClick={() => setDeleteTarget(null)}
                                className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--gray-700)] shadow-[var(--shadow-sm)] hover:bg-[var(--gray-50)] transition-colors cursor-pointer">
                                Cancel
                            </button>
                            <button onClick={confirmDelete}
                                className="rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-sm)] hover:bg-red-700 transition-colors cursor-pointer">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
