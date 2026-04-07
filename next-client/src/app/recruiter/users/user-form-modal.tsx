"use client";

import { useEffect, useState } from "react";
import { X, Eye, EyeOff, Loader2 } from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────────────────── */
export type Role = "Recruiter" | "Client" | "Admin";
export type Status = "active" | "disabled";

export type UserFormData = {
    accountName: string;
    email: string;
    phone: string;
    role: Role;
    status: Status;
    password: string;
};

export type EditableUser = {
    id: string;
    nickname: string;
    email: string;
    phone: string | null;
    roles: { userId: string; role: Role }[];
    isActive: boolean;
    password?: string;
};

/** State-driven modal: null = closed, otherwise describes what to show */
export type ModalState =
    | null
    | { mode: "add" }
    | { mode: "edit"; user: EditableUser };

type Props = {
    state: ModalState;
    onClose: () => void;
    onSaved: (data: UserFormData, editingId?: string) => Promise<void>;
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const CHEV = 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")';

const emptyForm = (): UserFormData => ({
    accountName: "", email: "", phone: "", role: "Recruiter", status: "active", password: "",
});

const inputCls = (err?: string) =>
    `w-full rounded-md border px-3 py-2 text-sm bg-[var(--surface)] focus:outline-none focus:ring-1 ${err
        ? "border-red-400 focus:ring-red-200"
        : "border-[var(--border)] focus:border-[var(--accent)] focus:ring-[var(--accent-ring)]"}`;

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function UserFormModal({ state, onClose, onSaved }: Props) {
    const [form, setForm] = useState<UserFormData>(emptyForm());
    const [showPw, setShowPw] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Sync form whenever the modal opens or switches mode
    useEffect(() => {
        if (!state) return;
        if (state.mode === "edit") {
            const u = state.user;
            setForm({
                accountName: u.nickname,
                email: u.email,
                phone: u.phone ?? "",
                role: u.roles[0]?.role ?? "Recruiter",
                status: u.isActive ? "active" : "disabled",
                password: u.password ?? "",
            });
        } else {
            setForm(emptyForm());
        }
        setErrors({});
        setIsSubmitting(false);
        setShowPw(false);
    }, [state]);

    if (!state) return null;

    const editingId = state.mode === "edit" ? state.user.id : undefined;

    /* ── validation ── */
    const validate = () => {
        const e: Partial<Record<keyof UserFormData, string>> = {};
        if (!form.accountName.trim()) e.accountName = "Account name is required.";
        if (!form.email.trim()) e.email = "Email is required.";
        if (!editingId && !form.password.trim()) e.password = "Password is required.";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await onSaved(form, editingId);
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (err: any) {
            console.error(err.message ?? "An error occurred while saving.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-xl bg-[var(--surface)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* header */}
                <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
                    <h2 className="text-lg font-semibold text-[var(--gray-900)]">
                        {editingId ? "Edit User" : "Add User"}
                    </h2>
                    <button onClick={onClose} className="rounded-md text-[var(--gray-400)] hover:text-[var(--gray-600)] hover:bg-[var(--gray-100)] p-1.5 transition">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* body */}
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

                        {/* Account Name */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[var(--gray-700)]">
                                Account Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                maxLength={100}
                                value={form.accountName}
                                onChange={e => setForm({ ...form, accountName: e.target.value })}
                                className={inputCls(errors.accountName)}
                                placeholder="e.g. Jane Smith"
                            />
                            {form.accountName.length >= 100 && (
                                <p className="text-xs text-red-500">Account name cannot exceed 100 characters</p>
                            )}
                            {errors.accountName && <p className="text-xs text-red-500">{errors.accountName}</p>}
                        </div>

                        {/* Role */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[var(--gray-700)]">
                                Role <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={form.role}
                                onChange={e => setForm({ ...form, role: e.target.value as Role })}
                                style={{ backgroundImage: CHEV, backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", backgroundSize: "1em" }}
                                className="w-full h-9 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 pr-8 text-sm text-[var(--gray-700)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] cursor-pointer appearance-none">
                                <option value="Recruiter">Recruiter</option>
                                <option value="Client">Client</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[var(--gray-700)]">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                maxLength={100}
                                type="email"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                className={inputCls(errors.email)}
                                placeholder="user@example.com"
                            />
                            {form.email.length >= 100 && (
                                <p className="text-xs text-red-500">Email cannot exceed 100 characters</p>
                            )}
                            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                        </div>

                        {/* Phone */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[var(--gray-700)]">Phone</label>
                            <input
                                maxLength={15}
                                type="tel"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                className={inputCls()}
                                placeholder="+1 416-555-0000"
                            />
                            {form.phone.length >= 15 && (
                                <p className="text-xs text-red-500">Phone number cannot exceed 15 characters</p>
                            )}
                        </div>

                        {/* Status toggle */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[var(--gray-700)]">Status</label>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, status: form.status === "active" ? "disabled" : "active" })}
                                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${form.status === "active" ? "bg-[var(--accent)]" : "bg-[var(--gray-300)]"}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.status === "active" ? "translate-x-6" : "translate-x-1"}`} />
                                </button>
                                <span className="text-sm text-[var(--gray-600)]">{form.status === "active" ? "Active" : "Disabled"}</span>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[var(--gray-700)]">
                                Password{" "}
                                {!editingId
                                    ? <span className="text-red-500">*</span>
                                    : <span className="text-xs font-normal text-[var(--gray-400)] ml-1">(leave blank to keep current)</span>
                                }
                            </label>
                            <div className="relative">
                                <input
                                    maxLength={100}
                                    type={showPw ? "text" : "password"}
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    className={inputCls(errors.password) + " pr-10"}
                                    placeholder={editingId ? (form.password ? "" : "No password on record") : "••••••••"}
                                />
                                {form.password.length >= 100 && (
                                    <p className="text-xs text-red-500">Password cannot exceed 100 characters</p>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setShowPw(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gray-400)] hover:text-[var(--gray-600)]">
                                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                        </div>
                    </div>

                    {/* footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--gray-50)] px-6 py-4">
                        <button type="button" onClick={onClose} disabled={isSubmitting}
                            className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--gray-700)] shadow-[var(--shadow-sm)] hover:bg-[var(--gray-50)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting}
                            className="flex items-center gap-2 rounded-md border border-transparent bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-sm)] hover:bg-[var(--accent-hover)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            Confirm
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
