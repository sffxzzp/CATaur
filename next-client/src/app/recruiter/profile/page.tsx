"use client";

import { useEffect, useState } from "react";
import { User, Phone, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { request } from "@/lib/request";

type CurrentUser = {
    id?: string;
    nickname?: string | null;
    phone?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    createdAt?: string | null;
};

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop";

function getAvatarKey(userId: string) {
    return `avatar_${userId}`;
}

function saveAvatarToLocal(userId: string, dataUrl: string) {
    try {
        localStorage.setItem(getAvatarKey(userId), dataUrl);
    } catch (e) {
        console.error('Failed to save avatar', e);
    }
}

function loadAvatarFromLocal(userId: string): string | null {
    try {
        return localStorage.getItem(getAvatarKey(userId));
    } catch (e) {
        return null;
    }
}

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState<"basic" | "password">("basic");

    const [basicInfo, setBasicInfo] = useState({
        nickname: "",
        phone: "",
        email: "",
    });

    const [basicForm, setBasicForm] = useState({
        nickname: "",
        phone: "",
        email: "",
    });
    const [createdAt, setCreatedAt] = useState<string | null>(null);

    const [pwdForm, setPwdForm] = useState({
        oldPwd: "",
        newPwd: "",
        confirmPwd: "",
    });
    const [basicSaving, setBasicSaving] = useState(false);
    const [pwdSaving, setPwdSaving] = useState(false);
    const [basicMsg, setBasicMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [avatarPreview, setAvatarPreview] = useState<string>(DEFAULT_AVATAR);
    const [userId, setUserId] = useState<string>("");

    useEffect(() => {
        let mounted = true;

        const loadCurrentUser = async () => {
            try {
                const user = await request<CurrentUser>("/users/me");
                if (!mounted) {
                    return;
                }

                const uid = user?.id || "";
                setUserId(uid);

                setBasicInfo({
                    nickname: user?.nickname ?? "",
                    phone: user?.phone ?? "",
                    email: user?.email ?? "",
                });
                setBasicForm({
                    nickname: user?.nickname ?? "",
                    phone: user?.phone ?? "",
                    email: user?.email ?? "",
                });

                const localAvatar = loadAvatarFromLocal(uid);
                setAvatarPreview(localAvatar || user?.avatarUrl || DEFAULT_AVATAR);
                setCreatedAt(user?.createdAt ?? null);
            } catch {
                if (!mounted) {
                    return;
                }
                setAvatarPreview(DEFAULT_AVATAR);
            }
        };

        loadCurrentUser();

        return () => {
            mounted = false;
        };
    }, []);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && userId) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                setAvatarPreview(dataUrl);
                saveAvatarToLocal(userId, dataUrl);
                window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { avatarUrl: dataUrl } }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBasicSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setBasicMsg(null);

        const nickname = basicForm.nickname.trim();
        const phone = basicForm.phone.trim();
        const email = basicForm.email.trim();
        if (!nickname) {
            setBasicMsg({ type: "error", text: "Account name is required." });
            return;
        }

        if (!email) {
            setBasicMsg({ type: "error", text: "Email is required." });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setBasicMsg({ type: "error", text: "Please enter a valid email address." });
            return;
        }

        try {
            setBasicSaving(true);
            await request("/users/me", {
                method: "PUT",
                json: {
                    nickname,
                    email,
                    phone: phone || undefined,
                },
            });

            setBasicForm((prev) => ({
                ...prev,
                nickname,
                email,
                phone,
            }));
            setBasicInfo({
                nickname,
                email,
                phone,
            });
            setBasicMsg({ type: "success", text: "Basic information saved." });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to save basic information.";
            setBasicMsg({ type: "error", text: message });
        } finally {
            setBasicSaving(false);
        }
    };

    const handlePasswordSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setPwdMsg(null);

        if (!pwdForm.oldPwd || !pwdForm.newPwd || !pwdForm.confirmPwd) {
            setPwdMsg({ type: "error", text: "Please fill in all password fields." });
            return;
        }

        if (pwdForm.newPwd !== pwdForm.confirmPwd) {
            setPwdMsg({ type: "error", text: "New passwords do not match." });
            return;
        }

        try {
            setPwdSaving(true);
            await request<{ message?: string }>("/auth/change-password", {
                method: "POST",
                json: {
                    oldPassword: pwdForm.oldPwd,
                    newPassword: pwdForm.newPwd,
                },
            });

            setPwdForm({ oldPwd: "", newPwd: "", confirmPwd: "" });
            setPwdMsg({ type: "success", text: "Password changed successfully." });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to change password.";
            setPwdMsg({ type: "error", text: message });
        } finally {
            setPwdSaving(false);
        }
    };

    const inpClass = "h-10 w-full max-w-lg rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] transition";
    const labelClass = "flex items-center text-sm font-semibold text-[var(--gray-800)] mb-1.5";
    const asterisk = <span className="text-[var(--danger)] mr-1">*</span>;
    const parsedCreatedAt = createdAt ? new Date(createdAt) : null;
    const hasValidCreatedAt = !!parsedCreatedAt && !Number.isNaN(parsedCreatedAt.getTime());
    const createdDateText = hasValidCreatedAt
        ? parsedCreatedAt.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })
        : "-";
    const createdTimeText = hasValidCreatedAt
        ? parsedCreatedAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
        : "-";

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">

                {/* Left Sidebar: Profile Info Box */}
                <div className="md:col-span-1 border border-[var(--border)] bg-[var(--surface)] rounded-lg shadow-[var(--shadow-sm)] overflow-hidden h-fit">
                    <div className="border-b border-[var(--border)] px-5 py-4">
                        <h2 className="text-sm font-semibold text-[var(--gray-900)] tracking-tight">Personal Information</h2>
                    </div>
                    <div className="p-6 flex flex-col items-center">
                        {/* Avatar */}
                        <label className="relative h-28 w-28 rounded-full overflow-hidden border-4 border-[var(--surface)] shadow-[var(--shadow-md)] cursor-pointer group">
                            <img
                                src={avatarPreview}
                                alt="Profile Avatar"
                                className="h-full w-full object-cover transition-opacity group-hover:opacity-75"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-semibold">Change</span>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                        </label>
                        <h3 className="mt-4 text-base font-semibold text-[var(--gray-900)]">{basicInfo.nickname || "Recruiter"}</h3>
                    </div>

                    <div className="px-5 py-4 border-t border-[var(--border)] divide-y divide-[var(--border-light)]">
                        <div className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-2 text-[var(--gray-700)]">
                                <User className="h-4 w-4" />
                                <span className="text-sm">Account name</span>
                            </div>
                            <span className="text-sm font-medium text-[var(--gray-900)]">{basicInfo.nickname || "-"}</span>
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-2 text-[var(--gray-700)]">
                                <Phone className="h-4 w-4" />
                                <span className="text-sm">Phone</span>
                            </div>
                            <span className="text-sm font-medium text-[var(--gray-900)]">{basicInfo.phone || "-"}</span>
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-2 text-[var(--gray-700)]">
                                <Mail className="h-4 w-4" />
                                <span className="text-sm">Email</span>
                            </div>
                            <span className="text-sm font-medium text-[var(--gray-900)]">{basicInfo.email || "-"}</span>
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-2 text-[var(--gray-700)]">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm">Created</span>
                            </div>
                            <span className="text-sm font-medium text-[var(--gray-900)] text-right leading-tight">
                                {createdDateText}<br /><span className="text-[11px] text-[var(--gray-500)]">{createdTimeText}</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Main Area: Tabs and Forms */}
                <div className="md:col-span-2 lg:col-span-3 border border-[var(--border)] bg-[var(--surface)] rounded-lg shadow-[var(--shadow-sm)] overflow-hidden flex flex-col min-h-[500px]">
                    <div className="border-b border-[var(--border)] px-5 py-4">
                        <h2 className="text-sm font-semibold text-[var(--gray-900)] tracking-tight">Basic Information</h2>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-6 px-6 border-b border-[var(--border)]">
                        <button
                            onClick={() => setActiveTab("basic")}
                            className={`pt-4 pb-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${activeTab === "basic"
                                    ? "border-[var(--accent)] text-[var(--accent)]"
                                    : "border-transparent text-[var(--gray-500)] cursor-pointer hover:text-[var(--gray-700)] cursor-pointer hover:border-[var(--gray-300)]"
                                }`}
                        >
                            Basic Information
                        </button>
                        <button
                            onClick={() => setActiveTab("password")}
                            className={`pt-4 pb-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${activeTab === "password"
                                    ? "border-[var(--accent)] text-[var(--accent)]"
                                    : "border-transparent text-[var(--gray-500)] cursor-pointer hover:text-[var(--gray-700)] cursor-pointer hover:border-[var(--gray-300)]"
                                }`}
                        >
                            Change Password
                        </button>
                    </div>

                    {/* Form Content */}
                    <div className="p-6 flex-1">
                        {activeTab === "basic" ? (
                            <form className="space-y-6" onSubmit={handleBasicSave}>
                                <div>
                                    <label className={labelClass}>{asterisk} Account name</label>
                                    <input
                                        className={inpClass}
                                        value={basicForm.nickname}
                                        onChange={(e) => setBasicForm({ ...basicForm, nickname: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>{asterisk} Phone number</label>
                                    <input
                                        className={inpClass}
                                        value={basicForm.phone}
                                        onChange={(e) => setBasicForm({ ...basicForm, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>{asterisk} Email</label>
                                    <input
                                        type="email"
                                        className={inpClass}
                                        value={basicForm.email}
                                        onChange={(e) => setBasicForm({ ...basicForm, email: e.target.value })}
                                    />
                                </div>
                                {basicMsg && (
                                    <p className={`text-sm ${basicMsg.type === "success" ? "text-[var(--accent)]" : "text-[var(--danger)]"}`}>
                                        {basicMsg.text}
                                    </p>
                                )}
                                <div className="pt-4 flex gap-3">
                                    <Button type="submit" disabled={basicSaving} className="bg-[var(--accent)] cursor-pointer hover:bg-[var(--accent-hover)] text-white px-6 w-24 disabled:cursor-not-allowed disabled:opacity-70">
                                        {basicSaving ? "Saving..." : "Save"}
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <form className="space-y-6" onSubmit={handlePasswordSave}>
                                <div>
                                    <label className={labelClass}>{asterisk} Old Password</label>
                                    <input
                                        type="password"
                                        placeholder="Enter old password"
                                        className={inpClass}
                                        value={pwdForm.oldPwd}
                                        onChange={(e) => setPwdForm({ ...pwdForm, oldPwd: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>{asterisk} New Password</label>
                                    <input
                                        type="password"
                                        placeholder="Enter new password"
                                        className={inpClass}
                                        value={pwdForm.newPwd}
                                        onChange={(e) => setPwdForm({ ...pwdForm, newPwd: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>{asterisk} Confirm Password</label>
                                    <input
                                        type="password"
                                        placeholder="Confirm new password"
                                        className={inpClass}
                                        value={pwdForm.confirmPwd}
                                        onChange={(e) => setPwdForm({ ...pwdForm, confirmPwd: e.target.value })}
                                    />
                                </div>
                                {pwdMsg && (
                                    <p className={`text-sm ${pwdMsg.type === "success" ? "text-[var(--accent)]" : "text-[var(--danger)]"}`}>
                                        {pwdMsg.text}
                                    </p>
                                )}
                                <div className="pt-4 flex gap-3">
                                    <Button type="submit" disabled={pwdSaving} className="bg-[var(--accent)] cursor-pointer hover:bg-[var(--accent-hover)] text-white px-6 w-24 disabled:cursor-not-allowed disabled:opacity-70">{pwdSaving ? "Saving..." : "Save"}</Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
