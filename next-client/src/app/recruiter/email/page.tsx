"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Mail, X } from "lucide-react";
import { request } from "@/lib/request";

/* ─── Types ───────────────────────────────────────────────────────────────── */
type EmailConfig = {
    host: string;
    port: number;
    auth: { user: string; pass: string };
    emailFrom: string;
    fromName: string;
};

const EMPTY: EmailConfig = {
    host: "", port: 587, auth: { user: "", pass: "" }, emailFrom: "", fromName: "",
};

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function EmailServerPage() {
    const [form, setForm] = useState<EmailConfig>(EMPTY);
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    // Test email dialog
    const [testOpen, setTestOpen] = useState(false);
    const [testEmail, setTestEmail] = useState("");
    const [testing, setTesting] = useState(false);
    const [testStatus, setTestStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    /* ── GET /admin/email-config ── */
    useEffect(() => {
        setLoading(true);
        request<EmailConfig>("/admin/email-config")
            .then(data => setForm(data ?? EMPTY))
            .catch(err => setStatus({ type: "error", msg: err.message ?? "Failed to load configuration." }))
            .finally(() => setLoading(false));
    }, []);

    /* ── PUT /admin/email-config ── */
    const handleSave = async () => {
        setSaving(true);
        setStatus(null);
        try {
            await request("/admin/email-config", { method: "PUT", json: form });
            setStatus({ type: "success", msg: "Settings saved successfully." });
        } catch (err: any) {
            setStatus({ type: "error", msg: err.message ?? "Failed to save settings." });
        } finally {
            setSaving(false);
        }
    };

    /* ── POST /admin/email-config/test ── */
    const handleTest = async () => {
        if (!testEmail.trim()) return;
        setTesting(true);
        setTestStatus(null);
        try {
            const res = await request<{ message?: string }>("/admin/email-config/test", {
                method: "POST",
                json: { email: testEmail.trim() },
            });
            setTestStatus({ type: "success", msg: res?.message ?? "Test email sent successfully." });
        } catch (err: any) {
            setTestStatus({ type: "error", msg: err?.message ?? "Failed to send test email." });
        } finally {
            setTesting(false);
        }
    };

    const openTestDialog = () => {
        setTestEmail("");
        setTestStatus(null);
        setTestOpen(true);
    };

    const field = "h-9 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--gray-900)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] placeholder:text-[var(--gray-400)]";

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[var(--gray-900)]">Email Server</h1>
                <p className="text-sm text-[var(--gray-500)] mt-1">SMTP configuration and sender identity for outgoing emails.</p>
            </div>

            {/* Card */}
            <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)]">
                {/* Card header */}
                <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--gray-50)] px-5 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--accent-light)]">
                        <Mail className="h-4 w-4 text-[var(--accent)]" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-[var(--gray-900)]">SMTP Settings</p>
                        <p className="text-xs text-[var(--gray-500)]">Configure outbound mail server and sender identity</p>
                    </div>
                </div>

                {/* Form */}
                <div className={`p-5 space-y-5 transition-opacity ${loading ? "opacity-40 pointer-events-none" : ""}`}>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[var(--gray-700)]">SMTP Host <span className="text-red-500">*</span></label>
                            <input maxLength={100} value={form.host} onChange={e => setForm({ ...form, host: e.target.value })}
                                placeholder="smtp.gmail.com" className={field} />
                            {form.host.length >= 100 && (
                                <p className="text-xs text-[var(--error)]">SMTP Host is too long</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[var(--gray-700)]">Port</label>
                            <input type="number" value={form.port}
                                onChange={e => setForm({ ...form, port: Number(e.target.value) })}
                                placeholder="587" className={field} />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[var(--gray-700)]">Username</label>
                            <input maxLength={100} value={form.auth.user}
                                onChange={e => setForm({ ...form, auth: { ...form.auth, user: e.target.value } })}
                                placeholder="smtp-user@example.com" className={field} />
                            {form.auth.user.length >= 100 && (
                                <p className="text-xs text-[var(--error)]">Username is too long</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[var(--gray-700)]">Password / App Password</label>
                            <div className="relative">
                                <input maxLength={100} type={showPw ? "text" : "password"} value={form.auth.pass}
                                    onChange={e => setForm({ ...form, auth: { ...form.auth, pass: e.target.value } })}
                                    placeholder="••••••••" className={field + " pr-10"} />
                                {form.auth.pass.length >= 100 && (
                                    <p className="text-xs text-[var(--error)]">Password is too long</p>
                                )}
                                <button type="button" onClick={() => setShowPw(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gray-400)] hover:text-[var(--gray-600)]">
                                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[var(--gray-700)]">From Name</label>
                            <input maxLength={100} value={form.fromName}
                                onChange={e => setForm({ ...form, fromName: e.target.value })}
                                placeholder="CATaur System" className={field} />
                            {form.fromName.length >= 100 && (
                                <p className="text-xs text-[var(--error)]">From Name is too long</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[var(--gray-700)]">From Email</label>
                            <input maxLength={100} type="email" value={form.emailFrom}
                                onChange={e => setForm({ ...form, emailFrom: e.target.value })}
                                placeholder="no-reply@cataur.com" className={field} />
                            {form.emailFrom.length >= 100 && (
                                <p className="text-xs text-[var(--error)]">From Email is too long</p>
                            )}
                        </div>
                    </div>

                    {status && (
                        <div className={`rounded-md px-4 py-2.5 text-sm ${status.type === "success" ? "bg-[var(--status-green-bg)] text-[var(--status-green-text)]" : "bg-[var(--status-red-bg)] text-[var(--status-red-text)]"}`}>
                            {status.msg}
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--gray-50)] px-5 py-3">
                    <button onClick={openTestDialog} disabled={loading || saving}
                        className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--gray-700)] shadow-[var(--shadow-sm)] cursor-pointer hover:bg-[var(--gray-50)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        Send test email
                    </button>
                    <button onClick={handleSave} disabled={loading || saving}
                        className="rounded-md border border-transparent bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-sm)] cursor-pointer hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        {saving ? "Saving…" : "Save settings"}
                    </button>
                </div>
            </div>

            {/* ═══════════════════ TEST EMAIL DIALOG ═══════════════════ */}
            {testOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="relative w-full max-w-sm rounded-xl bg-[var(--surface)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* header */}
                        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
                            <h2 className="text-lg font-semibold text-[var(--gray-900)]">Send Test Email</h2>
                            <button onClick={() => setTestOpen(false)}
                                className="rounded-md text-[var(--gray-400)] hover:text-[var(--gray-600)] hover:bg-[var(--gray-100)] p-1.5 transition">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* body */}
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-[var(--gray-600)]">
                                Enter an email address to receive a test message and verify your SMTP configuration.
                            </p>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[var(--gray-700)]">
                                    Test Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={testEmail}
                                    onChange={e => { setTestEmail(e.target.value); setTestStatus(null); }}
                                    placeholder="you@example.com"
                                    className={field}
                                    onKeyDown={e => { if (e.key === "Enter") handleTest(); }}
                                    autoFocus
                                />
                            </div>

                            {testStatus && (
                                <div className={`rounded-md px-4 py-2.5 text-sm ${testStatus.type === "success" ? "bg-[var(--status-green-bg)] text-[var(--status-green-text)]" : "bg-[var(--status-red-bg)] text-[var(--status-red-text)]"}`}>
                                    {testStatus.msg}
                                </div>
                            )}
                        </div>

                        {/* footer */}
                        <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--gray-50)] px-6 py-4">
                            <button onClick={() => setTestOpen(false)}
                                className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--gray-700)] shadow-[var(--shadow-sm)] hover:bg-[var(--gray-50)] transition-colors cursor-pointer">
                                Close
                            </button>
                            <button onClick={handleTest} disabled={testing || !testEmail.trim()}
                                className="rounded-md border border-transparent bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-sm)] cursor-pointer hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                {testing ? "Sending…" : "Send"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
