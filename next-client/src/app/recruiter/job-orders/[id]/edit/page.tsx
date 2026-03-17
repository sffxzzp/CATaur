"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Code, Eye, Briefcase, MapPin, Building2, CircleDollarSign, Loader2, Save } from "lucide-react";
import { CLIENTS, JOB_ORDERS, type JobOrder } from "@/data/recruiter";
import { toast } from "sonner";

const STORAGE_KEY = "ADDED_JOB_ORDERS";

type JobOrderExtra = JobOrder & {
    department?: string;
    salary?: string;
    type?: string;
    workArrangement?: string;
    description?: string;
    notes?: string;
};

type JobOrderInput = {
    title: string;
    client: string;
    location: string;
    department: string;
    salary: string;
    status: "active" | "onhold" | "closed";
    openings: number | "";
    type: string;
    workArrangement: string;
    description: string;
};

const defaultForm: JobOrderInput = {
    title: "",
    client: "",
    location: "",
    department: "",
    salary: "",
    status: "active",
    openings: 1,
    type: "Full-time",
    workArrangement: "Remote",
    description: "",
};

export default function EditJobOrderPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
    const [form, setForm] = useState<JobOrderInput>(defaultForm);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!id) return;

        // Simulate fetch from DB / LocalStorage
        const fetchJob = () => {
            let foundJob: JobOrderExtra | undefined;

            // 1. Try local storage first
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const arr = JSON.parse(raw) as JobOrderExtra[];
                    foundJob = arr.find((j) => j.id === id);
                }
            } catch (e) {
                console.error("Failed to parse local job orders", e);
            }

            // 2. Fallback to mock data
            if (!foundJob) {
                foundJob = JOB_ORDERS.find((j) => j.id === id) as JobOrderExtra;
            }

            if (foundJob) {
                // Map data to form
                const mappedStatus =
                    ["sourcing", "interview", "offer", "active"].includes(foundJob.status) ? "active" :
                        foundJob.status === "paused" ? "onhold" : "closed";

                setForm({
                    title: foundJob.title || "",
                    client: foundJob.client || "",
                    location: foundJob.location || "",
                    department: foundJob.department || "",
                    salary: foundJob.salary || "",
                    status: mappedStatus as any,
                    openings: foundJob.openings || 1,
                    type: foundJob.type || "Full-time",
                    workArrangement: foundJob.workArrangement || "Remote",
                    description: foundJob.description || "## Job Description\n\n- Responsibilities\n- Requirements\n\n",
                });
            } else {
                // Handle not found
                console.error("Job Order not found:", id);
                toast.error("Job order not found.");
                router.push("/recruiter/job-orders");
            }
            setLoading(false);
        };

        fetchJob();
    }, [id, router]);


    const companyOptions = CLIENTS.map((c) => c.company);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (saving || !form.title.trim() || !form.status) return;
        setSaving(true);

        // Convert form status to match JobOrder status enum roughly
        const finalStatus =
            form.status === "active" ? "sourcing" : // Default to sourcing if active
                form.status === "onhold" ? "paused" : "filled";

        // Simulate saving to DB/LocalStorage
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            let list = raw ? (JSON.parse(raw) as JobOrderExtra[]) : [];

            const existingIdx = list.findIndex(j => j.id === id);

            const updatedRecord: JobOrderExtra = {
                id: id as string,
                title: form.title.trim(),
                client: form.client.trim() || companyOptions[0] || "New Client",
                status: finalStatus as any,
                openings: Number(form.openings) || 1,
                priority: "medium", // Preserve existing or default
                location: form.location.trim() || "Remote",
                updatedAt: "Just now",
                tags: form.department ? [form.department] : [],
                applicants: existingIdx >= 0 ? list[existingIdx].applicants : 0, // Preserve existing
                description: form.description.trim(),
                type: form.type,
                workArrangement: form.workArrangement,
                salary: form.salary,
                department: form.department,
            };

            if (existingIdx >= 0) {
                // Update existing in local storage
                // Preserve applicants and tags if they existed and we don't have new ones
                updatedRecord.applicants = list[existingIdx].applicants;
                updatedRecord.priority = list[existingIdx].priority;
                if (!form.department && list[existingIdx].tags?.length) {
                    updatedRecord.tags = list[existingIdx].tags;
                }

                list[existingIdx] = updatedRecord;
            } else {
                // It was a mock data item, so we add it to local storage overrides
                const sourceMock = JOB_ORDERS.find(j => j.id === id);
                if (sourceMock) {
                    updatedRecord.applicants = sourceMock.applicants;
                    updatedRecord.priority = sourceMock.priority;
                }
                list.unshift(updatedRecord);
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
            toast.success("Job order updated successfully.");

            // Redirect back to details page
            router.push(`/recruiter/job-orders/${encodeURIComponent(id as string)}`);
        } catch {
            toast.error("Failed to save job order.");
            setSaving(false);
        }
    };

    if (!mounted || loading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    const inpClass = "h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] transition";
    const labelClass = "text-sm font-semibold text-[var(--gray-800)] block mb-1.5 flex items-center gap-2";

    return (
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
            <div className="text-sm text-[var(--gray-500)] flex items-center gap-2 mb-4">
                <Link href="/recruiter/job-orders" className="cursor-pointer hover:text-[var(--accent)] transition">Job Orders</Link>
                <span className="text-[var(--gray-300)]">/</span>
                <Link href={`/recruiter/job-orders/${encodeURIComponent(id as string)}`} className="cursor-pointer hover:text-[var(--accent)] transition">{id}</Link>
                <span className="text-[var(--gray-300)]">/</span>
                <span className="text-[var(--gray-800)] font-medium">Edit</span>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--gray-900)] tracking-tight">Edit Job Order</h1>
                    <p className="text-sm text-[var(--gray-500)] mt-1">
                        Update the details for <strong>{form.title}</strong>
                    </p>
                </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8 shadow-[var(--shadow-sm)]">
                <form className="grid gap-6 md:grid-cols-2" onSubmit={onSubmit}>

                    {/* Title - Required */}
                    <div className="md:col-span-2">
                        <label className={labelClass}>
                            <Briefcase className="w-4 h-4 text-[var(--gray-400)]" />
                            Job Title <span className="text-[var(--danger)]">*</span>
                        </label>
                        <input
                            required
                            className={inpClass}
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="e.g., Senior Full-stack Engineer"
                        />
                    </div>

                    {/* Left Column */}
                    <div className="space-y-6">
                        <div>
                            <label className={labelClass}>
                                <Building2 className="w-4 h-4 text-[var(--gray-400)]" />
                                Company
                            </label>
                            <select
                                className={inpClass}
                                value={form.client}
                                onChange={(e) => setForm({ ...form, client: e.target.value })}
                            >
                                <option value="" disabled>Select a company</option>
                                {companyOptions.map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>
                                <MapPin className="w-4 h-4 text-[var(--gray-400)]" />
                                Location
                            </label>
                            <input
                                className={inpClass}
                                value={form.location}
                                onChange={(e) => setForm({ ...form, location: e.target.value })}
                                placeholder="e.g., Calgary, CA"
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Department</label>
                            <input
                                className={inpClass}
                                value={form.department}
                                onChange={(e) => setForm({ ...form, department: e.target.value })}
                                placeholder="e.g., Engineering"
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                <CircleDollarSign className="w-4 h-4 text-[var(--gray-400)]" />
                                Salary
                            </label>
                            <input
                                className={inpClass}
                                value={form.salary}
                                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                                placeholder="e.g., $120k - $150k"
                            />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <div>
                            <label className={labelClass}>
                                Status <span className="text-[var(--danger)]">*</span>
                            </label>
                            <select
                                required
                                className={inpClass}
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                            >
                                <option value="active">Active</option>
                                <option value="onhold">On Hold</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>Openings</label>
                            <input
                                type="number"
                                min={1}
                                className={inpClass}
                                value={form.openings}
                                onChange={(e) => setForm({ ...form, openings: e.target.value === "" ? "" : Number(e.target.value) })}
                                placeholder="Number of headcount"
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Type</label>
                            <select
                                className={inpClass}
                                value={form.type}
                                onChange={(e) => setForm({ ...form, type: e.target.value })}
                            >
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Contract">Contract</option>
                                <option value="Temporary">Temporary</option>
                                <option value="Internship">Internship</option>
                                <option value="Permanent">Permanent</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>Work Arrangement</label>
                            <select
                                className={inpClass}
                                value={form.workArrangement}
                                onChange={(e) => setForm({ ...form, workArrangement: e.target.value })}
                            >
                                <option value="Remote">Remote</option>
                                <option value="Onsite">Onsite</option>
                                <option value="Hybrid">Hybrid</option>
                            </select>
                        </div>
                    </div>

                    {/* Markdown Editor Section */}
                    <div className="md:col-span-2 mt-4 space-y-2">
                        <div className="flex items-center justify-between border-b border-[var(--border-light)] pb-2 mb-2">
                            <label className="text-sm font-semibold text-[var(--gray-800)] flex items-center gap-2">
                                Description
                            </label>
                            <div className="flex gap-1 bg-[var(--gray-50)] p-1 rounded-md border border-[var(--border)]">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("edit")}
                                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded transition-colors ${activeTab === "edit" ? "bg-[var(--surface)] shadow-sm text-[var(--gray-900)] border border-[var(--border-light)]" : "text-[var(--gray-500)] hover:text-[var(--gray-900)]"
                                        }`}
                                >
                                    <Code className="w-3.5 h-3.5" />
                                    Edit Markdown
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("preview")}
                                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded transition-colors ${activeTab === "preview" ? "bg-[var(--surface)] shadow-sm text-[var(--gray-900)] border border-[var(--border-light)]" : "text-[var(--gray-500)] hover:text-[var(--gray-900)]"
                                        }`}
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    Preview
                                </button>
                            </div>
                        </div>

                        <div className="rounded-md border border-[var(--border)] overflow-hidden bg-[var(--surface)] transition-all">
                            {activeTab === "edit" ? (
                                <textarea
                                    className="w-full min-h-[400px] resize-y bg-transparent px-4 py-4 text-sm font-mono text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="# Write the full job description here..."
                                />
                            ) : (
                                <div className="w-full min-h-[400px] prose prose-sm prose-blue dark:prose-invert max-w-none px-6 py-4">
                                    <ReactMarkdown>{form.description || "*No description provided yet.*"}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="md:col-span-2 mt-8 pt-6 border-t border-[var(--border)] flex items-center justify-end gap-3">
                        <Link
                            href={`/recruiter/job-orders/${encodeURIComponent(id as string)}`}
                            className="px-4 py-2 border border-[var(--border)] rounded-md text-sm font-semibold text-[var(--gray-700)] bg-[var(--surface)] hover:bg-[var(--gray-50)] transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={saving || !form.title.trim()}
                            className="flex items-center gap-2 px-5 py-2 rounded-md font-semibold text-sm bg-[var(--accent)] text-white hover:bg-[#1e40af] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
