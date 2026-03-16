"use client";

import { GuestGate } from "@/components/candidate/guest-gate";
import { useState, useEffect } from "react";
import { request } from "@/lib/request";
import { COUNTRIES, REGIONS, CITIES, type CountryCode } from "@/data/locations";
import { Button } from "@/components/ui/button";
import {
  FileText,
  MapPin,
  PenSquare,
  Target,
  Briefcase,
  GraduationCap,
  Award,
  Upload,
  CheckCircle2,
  File,
  Mail,
  Phone,
  UserCircle,
  ArrowRight,
  Loader2,
  X,
  AlertTriangle,
  RotateCcw,
  Plus,
  Trash2,
} from "lucide-react";
import { candidateSelfProfileClient } from "@/lib/api/candidate-self-profile";
import type {
  CandidateProfileExtended,
  CandidateWorkExperience,
  CandidateEducation,
} from "@/lib/api/candidate-profile-types";

// ─── Reusable modal shell ──────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
  footer,
  maxWidth = "max-w-2xl",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div
        className={`w-full ${maxWidth} overflow-hidden rounded-lg border border-[var(--border-light)] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]`}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-light)] px-6 py-4">
          <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#111827]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-6">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-[var(--border-light)] bg-[#F9FAFB] px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[#374151]">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#111827] transition focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20";

function SectionCard({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[var(--border-light)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--border-light)] px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[#1D4ED8]">{icon}</span>
          <span className="text-sm font-medium text-[#111827]">{title}</span>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Helper to format date for display ────────────────────────────────────────
function formatDate(d: string | null | undefined): string {
  if (!d) return "";
  // "2021-03" → "Mar 2021", "2021-03-01" → "Mar 2021"
  const parts = d.split("-");
  if (parts.length >= 2) {
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[monthNum - 1] ?? ""} ${year}`;
  }
  return d;
}

function formatDuration(exp: CandidateWorkExperience): string {
  const start = formatDate(exp.startDate);
  const end = exp.isCurrent ? "Present" : formatDate(exp.endDate);
  if (!start && !end) return "";
  if (!start) return end;
  if (!end) return start;
  return `${start} – ${end}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [step, setStep] = useState<"empty" | "basic-info" | "uploading" | "parsing" | "complete">(
    "basic-info"
  );
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<CandidateProfileExtended | null>(null);
  const [saving, setSaving] = useState(false);

  // Controlled form for basic-info onboarding step
  const [basicForm, setBasicForm] = useState({
    firstName: "", lastName: "", phone: "", linkedin: "",
  });

  // Location state (onboarding + edit modal share these)
  const [locCountry, setLocCountry] = useState<CountryCode | "">("");
  const [locRegion, setLocRegion] = useState("");
  const [locCity, setLocCity] = useState("");

  // Modal visibility
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<CandidateWorkExperience | null>(null);
  const [isAddEducationOpen, setIsAddEducationOpen] = useState(false);
  const [editingEdu, setEditingEdu] = useState<CandidateEducation | null>(null);
  const [isManageSkillsOpen, setIsManageSkillsOpen] = useState(false);
  const [isEditPreferencesOpen, setIsEditPreferencesOpen] = useState(false);

  // Resume upload state
  const [resumeUploadState, setResumeUploadState] = useState<
    "hidden" | "selecting" | "parsing" | "overwrite-prompt"
  >("hidden");
  const [latestParsedResume, setLatestParsedResume] = useState<any>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Skill add form
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState<"Expert" | "Intermediate" | "Beginner">("Intermediate");

  // Work experience form state
  const [expForm, setExpForm] = useState({
    role: "", company: "", startDate: "", endDate: "", isCurrent: false, highlights: "",
  });

  // Education form state
  const [eduForm, setEduForm] = useState({
    school: "", degree: "", fieldOfStudy: "", graduationYear: "",
  });

  // Preferences form state
  const [prefForm, setPrefForm] = useState({
    targetSalary: "", preferredLocation: "", noticePeriod: "",
  });

  const handleCountryChange = (code: CountryCode | "") => {
    setLocCountry(code);
    setLocRegion("");
    setLocCity("");
  };
  const handleRegionChange = (code: string) => {
    setLocRegion(code);
    setLocCity("");
  };

  const showSuccessToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await candidateSelfProfileClient.getMyProfile();
        setProfile(data);

        // Pre-fill basic-info form with whatever we already know
        const nameParts = (data.nickname || "").split(" ");
        setBasicForm({
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" "),
          phone: data.phone || "",
          linkedin: data.linkedin || "",
        });

        // Parse currentLocation into country/region/city if set
        if (data.currentLocation) {
          const parts = data.currentLocation.split(", ");
          if (parts.length >= 3) {
            setLocCity(parts[0]);
            setLocRegion(parts[1]);
            setLocCountry(parts[2] as CountryCode);
          } else if (parts.length === 2) {
            setLocCity(parts[0]);
            setLocRegion(parts[1]);
          }
        }

        // profileStatus 'active' means onboarding was completed
        if (data.profileStatus === "active") {
          setStep("complete");
          localStorage.setItem("candidateProfileBasic", "1");
        }
        if (data.resumeUrl) {
          localStorage.setItem("candidateProfileResume", "1");
        }
      } catch {
        // Not yet a candidate or no profile — stay on basic-info step
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  // ─── Onboarding: save basic info ──────────────────────────────────────────
  const handleSaveBasicInfo = async () => {
    const nickname = [basicForm.firstName, basicForm.lastName].filter(Boolean).join(" ");
    const currentLocation = [locCity, locRegion, locCountry].filter(Boolean).join(", ");
    setSaving(true);
    try {
      // Save extended candidate fields
      const updated = await candidateSelfProfileClient.updateMyProfile({
        phone: basicForm.phone || undefined,
        linkedin: basicForm.linkedin || undefined,
        currentLocation: currentLocation || undefined,
        profileStatus: "active",
      });
      // Also update display name (nickname) on the user record
      if (nickname) {
        await request("/candidate/profile", { method: "PUT", json: { nickname } });
        // Re-fetch so nickname is reflected in profile state
        const full = await candidateSelfProfileClient.getMyProfile();
        setProfile(full);
      } else {
        setProfile(updated);
      }
      localStorage.setItem("candidateProfileBasic", "1");
      if (!localStorage.getItem("candidateName")) {
        localStorage.setItem("candidateName", nickname || "Candidate");
      }
      setStep("uploading");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ─── Resume upload flow ────────────────────────────────────────────────────
  const processResumeUpload = async (file: File, flow: "onboarding" | "update") => {
    try {
      if (flow === "onboarding") setStep("parsing");
      setParseError(null);

      // Upload directly to external file service
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("https://file-service.cataur.freedeeplearn.com/files/upload", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("File upload failed");
      const uploadedData = await uploadRes.json();
      // Build absolute URL: file service returns a relative path like "/views/xxxxx"
      const rawPath: string = uploadedData.url || uploadedData.path || "";
      const resumeUrl = /^https?:\/\//i.test(rawPath)
        ? rawPath
        : `https://file-service.cataur.freedeeplearn.com${rawPath.startsWith("/") ? rawPath : `/${rawPath}`}`;

      const parseRes = await request<any>("/candidate/resume/parse", {
        method: "POST",
        json: { resumeUrl },
      });
      setLatestParsedResume(parseRes);

      if (flow === "onboarding") {
        await applyResumeData(parseRes.id, "overwrite");
        setStep("complete");
        setShowToast(true);
        localStorage.setItem("candidateProfileResume", "1");
      } else {
        setResumeUploadState("overwrite-prompt");
      }
    } catch (err: any) {
      setParseError(err.message || "Failed to process resume");
      if (flow === "onboarding") setStep("uploading");
      else setResumeUploadState("hidden");
    }
  };

  const applyResumeData = async (parserId: string, applyMode: "overwrite" | "merge") => {
    await request("/candidate/resume/apply", { method: "POST", json: { parserId, applyMode } });
    const updated = await candidateSelfProfileClient.getMyProfile();
    setProfile(updated);
  };

  const handleSimulateUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.docx,.doc,.txt,.rtf";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      await processResumeUpload(file, "onboarding");
    };
    input.click();
  };

  const handleReuploadSimulate = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.docx,.doc,.txt,.rtf";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setResumeUploadState("parsing");
      await processResumeUpload(file, "update");
    };
    input.click();
  };

  const handleApplyOverwrite = async () => {
    if (!latestParsedResume?.id) return;
    await applyResumeData(latestParsedResume.id, "overwrite");
    setResumeUploadState("hidden");
  };

  const handleKeepManual = async () => {
    if (!latestParsedResume?.id) return;
    await applyResumeData(latestParsedResume.id, "merge");
    setResumeUploadState("hidden");
  };

  const handleFillManually = async () => {
    localStorage.setItem("candidateProfileBasic", "1");
    localStorage.setItem("candidateProfileResume", "1");
    try {
      await candidateSelfProfileClient.updateMyProfile({ profileStatus: "active" });
    } catch { /* best-effort */ }
    setStep("complete");
    setShowToast(false);
  };

  // ─── Edit basic profile (modal save) ──────────────────────────────────────
  const handleSaveEditProfile = async () => {
    const nickname = [basicForm.firstName, basicForm.lastName].filter(Boolean).join(" ");
    const currentLocation = [locCity, locRegion, locCountry].filter(Boolean).join(", ");
    setSaving(true);
    try {
      const updated = await candidateSelfProfileClient.updateMyProfile({
        phone: basicForm.phone || undefined,
        linkedin: basicForm.linkedin || undefined,
        currentLocation: currentLocation || undefined,
      });
      if (nickname) {
        await request("/candidate/profile", { method: "PUT", json: { nickname } });
        const full = await candidateSelfProfileClient.getMyProfile();
        setProfile(full);
      } else {
        setProfile(updated);
      }
      setIsEditProfileOpen(false);
      showSuccessToast("Profile updated successfully");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ─── Work Experience CRUD ──────────────────────────────────────────────────
  const openAddExp = () => {
    setEditingExp(null);
    setExpForm({ role: "", company: "", startDate: "", endDate: "", isCurrent: false, highlights: "" });
    setIsAddRoleOpen(true);
  };
  const openEditExp = (exp: CandidateWorkExperience) => {
    setEditingExp(exp);
    const highlights = exp.highlights
      ? (JSON.parse(exp.highlights) as string[]).join("\n")
      : "";
    setExpForm({
      role: exp.role,
      company: exp.company,
      startDate: exp.startDate?.slice(0, 7) || "",
      endDate: exp.endDate?.slice(0, 7) || "",
      isCurrent: exp.isCurrent,
      highlights,
    });
    setIsAddRoleOpen(true);
  };
  const handleSaveExp = async () => {
    setSaving(true);
    try {
      const highlights = expForm.highlights
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const body = {
        role: expForm.role,
        company: expForm.company,
        startDate: expForm.startDate ? `${expForm.startDate}-01` : undefined,
        endDate: (!expForm.isCurrent && expForm.endDate) ? `${expForm.endDate}-01` : undefined,
        isCurrent: expForm.isCurrent,
        highlights: highlights.length ? highlights : undefined,
      };
      if (editingExp) {
        await candidateSelfProfileClient.updateWorkExperience(editingExp.id, body);
      } else {
        await candidateSelfProfileClient.addWorkExperience(body);
      }
      const updated = await candidateSelfProfileClient.getMyProfile();
      setProfile(updated);
      setIsAddRoleOpen(false);
      showSuccessToast(editingExp ? "Work experience updated" : "Work experience added");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteExp = async (id: string) => {
    if (!confirm("Delete this work experience?")) return;
    await candidateSelfProfileClient.deleteWorkExperience(id);
    const updated = await candidateSelfProfileClient.getMyProfile();
    setProfile(updated);
    showSuccessToast("Work experience deleted");
  };

  // ─── Education CRUD ────────────────────────────────────────────────────────
  const openAddEdu = () => {
    setEditingEdu(null);
    setEduForm({ school: "", degree: "", fieldOfStudy: "", graduationYear: "" });
    setIsAddEducationOpen(true);
  };
  const openEditEdu = (edu: CandidateEducation) => {
    setEditingEdu(edu);
    setEduForm({
      school: edu.school,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy || "",
      graduationYear: edu.graduationYear?.toString() || "",
    });
    setIsAddEducationOpen(true);
  };
  const handleSaveEdu = async () => {
    setSaving(true);
    try {
      const body = {
        school: eduForm.school,
        degree: eduForm.degree,
        fieldOfStudy: eduForm.fieldOfStudy || undefined,
        graduationYear: eduForm.graduationYear ? parseInt(eduForm.graduationYear) : undefined,
      };
      if (editingEdu) {
        await candidateSelfProfileClient.updateEducation(editingEdu.id, body);
      } else {
        await candidateSelfProfileClient.addEducation(body);
      }
      const updated = await candidateSelfProfileClient.getMyProfile();
      setProfile(updated);
      setIsAddEducationOpen(false);
      showSuccessToast(editingEdu ? "Education updated" : "Education added");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteEdu = async (id: string) => {
    if (!confirm("Delete this education entry?")) return;
    await candidateSelfProfileClient.deleteEducation(id);
    const updated = await candidateSelfProfileClient.getMyProfile();
    setProfile(updated);
    showSuccessToast("Education deleted");
  };

  // ─── Skills CRUD ───────────────────────────────────────────────────────────
  const handleAddSkill = async () => {
    if (!newSkillName.trim()) return;
    setSaving(true);
    try {
      await candidateSelfProfileClient.addSkill({ skillName: newSkillName.trim(), skillLevel: newSkillLevel });
      const updated = await candidateSelfProfileClient.getMyProfile();
      setProfile(updated);
      setNewSkillName("");
      setNewSkillLevel("Intermediate");
      showSuccessToast("Skill added");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteSkill = async (skillId: string) => {
    await candidateSelfProfileClient.deleteSkill(skillId);
    const updated = await candidateSelfProfileClient.getMyProfile();
    setProfile(updated);
    showSuccessToast("Skill removed");
  };

  // ─── Preferences CRUD ─────────────────────────────────────────────────────
  const openPreferences = () => {
    setPrefForm({
      targetSalary: profile?.targetSalary || "",
      preferredLocation: profile?.preferredLocation || "",
      noticePeriod: profile?.noticePeriod?.toString() || "",
    });
    setIsEditPreferencesOpen(true);
  };
  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      const updated = await candidateSelfProfileClient.updateMyProfile({
        targetSalary: prefForm.targetSalary || undefined,
        preferredLocation: prefForm.preferredLocation || undefined,
        noticePeriod: prefForm.noticePeriod ? parseInt(prefForm.noticePeriod) : undefined,
      });
      setProfile(updated);
      setIsEditPreferencesOpen(false);
      showSuccessToast("Preferences updated");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ─── Derived display values ────────────────────────────────────────────────
  const displayName = profile?.nickname || "Your Name";
  const displayEmail = profile?.email || (typeof window !== "undefined" ? localStorage.getItem("candidateEmail") : "") || "";
  const displayPhone = profile?.phone || "";
  const displayLocation = profile?.currentLocation || "";
  const displayLinkedin = profile?.linkedin || "";

  const workExperiences = profile?.workExperience || [];
  const educations = profile?.education || [];
  const skills = profile?.skills || [];

  return (
    <GuestGate>
      <div className="mx-auto max-w-7xl px-6 py-8 pb-12">
        {isLoadingProfile ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#1D4ED8]" />
            <p className="mt-4 text-sm text-[#6B7280]">Loading profile...</p>
          </div>
        ) : (
          <>
            {/* ── Onboarding: Step 1 Basic Info ── */}
            {step === "basic-info" && (
              <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-[var(--border-light)] bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-[var(--border-light)] px-6 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#EFF6FF]">
                    <UserCircle className="h-5 w-5 text-[#1D4ED8]" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[#111827]">Basic Information</h2>
                    <p className="text-xs text-[#6B7280]">Let&apos;s start with your contact details.</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="First Name">
                      <input
                        type="text"
                        className={inputCls}
                        placeholder="John"
                        value={basicForm.firstName}
                        onChange={(e) => setBasicForm((f) => ({ ...f, firstName: e.target.value }))}
                      />
                    </FormField>
                    <FormField label="Last Name">
                      <input
                        type="text"
                        className={inputCls}
                        placeholder="Doe"
                        value={basicForm.lastName}
                        onChange={(e) => setBasicForm((f) => ({ ...f, lastName: e.target.value }))}
                      />
                    </FormField>
                    <FormField label="Email Address">
                      <input type="email" className={inputCls} value={profile?.email ?? ""} disabled />
                    </FormField>
                    <FormField label="Phone Number">
                      <input
                        type="tel"
                        className={inputCls}
                        placeholder="+1 (416) 555-0198"
                        value={basicForm.phone}
                        onChange={(e) => setBasicForm((f) => ({ ...f, phone: e.target.value }))}
                      />
                    </FormField>
                    <FormField label="Country">
                      <select value={locCountry} onChange={(e) => handleCountryChange(e.target.value as CountryCode | "")} className={inputCls}>
                        <option value="">Select country…</option>
                        {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Province / State">
                      <select value={locRegion} onChange={(e) => handleRegionChange(e.target.value)} disabled={!locCountry} className={`${inputCls} disabled:opacity-50 disabled:cursor-not-allowed`}>
                        <option value="">Select province/state…</option>
                        {locCountry && REGIONS[locCountry].map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
                      </select>
                    </FormField>
                    <FormField label="City">
                      <div className="sm:col-span-2">
                        <select value={locCity} onChange={(e) => setLocCity(e.target.value)} disabled={!locRegion} className={`${inputCls} disabled:opacity-50 disabled:cursor-not-allowed`}>
                          <option value="">Select city…</option>
                          {locCountry && locRegion && (CITIES[locCountry][locRegion] ?? []).map((city) => <option key={city} value={city}>{city}</option>)}
                        </select>
                      </div>
                    </FormField>
                    <FormField label="LinkedIn Profile URL">
                      <div className="sm:col-span-2">
                        <input
                          type="url"
                          className={inputCls}
                          placeholder="https://linkedin.com/in/..."
                          value={basicForm.linkedin}
                          onChange={(e) => setBasicForm((f) => ({ ...f, linkedin: e.target.value }))}
                        />
                      </div>
                    </FormField>
                  </div>
                </div>
                <div className="flex justify-end gap-2 border-t border-[var(--border-light)] bg-[#F9FAFB] px-6 py-4">
                  <Button onClick={handleSaveBasicInfo} className="gap-1.5" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Continue to Resume
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── Onboarding: Step 2 Upload ── */}
            {step === "uploading" && (
              <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-[var(--border-light)] bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-[var(--border-light)] px-6 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#EFF6FF]">
                    <FileText className="h-5 w-5 text-[#1D4ED8]" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[#111827]">Upload Resume</h2>
                    <p className="text-xs text-[#6B7280]">We&apos;ll use AI to extract your experience and skills.</p>
                  </div>
                </div>
                <div className="p-6">
                  <div
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#D1D5DB] bg-[#F9FAFB] p-14 transition hover:border-[#1D4ED8] hover:bg-[#EFF6FF]/30"
                    onClick={handleSimulateUpload}
                  >
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-white border border-[var(--border-light)]">
                      <Upload className="h-6 w-6 text-[#1D4ED8]" />
                    </div>
                    <h3 className="text-sm font-semibold text-[#111827]">Click to browse or drag and drop</h3>
                    <p className="mt-1 text-xs text-[#6B7280]">PDF, DOCX, or RTF (Max 5MB)</p>
                  </div>
                </div>
                <div className="flex justify-between gap-2 border-t border-[var(--border-light)] bg-[#F9FAFB] px-6 py-4">
                  <Button variant="outline" onClick={() => setStep("basic-info")}>Back</Button>
                  <Button variant="outline" onClick={handleFillManually} className="text-[#6B7280]">
                    Skip this step
                  </Button>
                </div>
              </div>
            )}

            {/* ── Onboarding: Step 3 Parsing ── */}
            {step === "parsing" && (
              <div className="mx-auto mt-20 max-w-sm rounded-lg border border-[var(--border-light)] bg-white p-10 text-center shadow-sm">
                <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-[#1D4ED8]" />
                <h2 className="text-lg font-semibold text-[#111827]">Analyzing your resume...</h2>
                <p className="mt-2 text-sm text-[#6B7280]">
                  Our AI is extracting your work experience, education, and skills. This will take just a moment.
                </p>
                {parseError && <p className="mt-4 text-sm text-red-600 font-medium">Error: {parseError}</p>}
                <div className="mx-auto mt-6 h-1 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
                  <div className="h-full animate-pulse rounded-full bg-[#1D4ED8]" />
                </div>
              </div>
            )}

            {/* ── Complete Profile View ── */}
            {step === "complete" && (
              <div className="animate-fade-in">
                {showToast && (
                  <div className="mb-5 flex items-start justify-between rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3">
                    <div className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#166534]" />
                      <div>
                        <p className="text-sm font-semibold text-[#166534]">Profile drafted successfully!</p>
                        <p className="mt-0.5 text-xs text-[#166534]/80">
                          We&apos;ve extracted your information using AI. Please review the sections below to ensure accuracy.
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setShowToast(false)} className="rounded p-1 text-[#166534] hover:bg-[#BBF7D0]/50">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Identity Card */}
                <div className="mb-6 rounded-lg border border-[var(--border-light)] bg-white p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <h1 className="text-2xl font-semibold text-[#111827]">{displayName}</h1>
                      {workExperiences[0] && (
                        <p className="mt-0.5 text-sm font-medium text-[#374151]">{workExperiences[0].role}</p>
                      )}
                      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#374151]">
                        {displayEmail && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-[#6B7280]" />
                            {displayEmail}
                          </div>
                        )}
                        {displayPhone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-[#6B7280]" />
                            {displayPhone}
                          </div>
                        )}
                        {displayLocation && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-[#6B7280]" />
                            {displayLocation}
                          </div>
                        )}
                        {displayLinkedin && (
                          <a href={displayLinkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#1D4ED8] hover:underline underline-offset-2">
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                            LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5 self-start" onClick={() => {
                      const nameParts = (profile?.nickname || "").split(" ");
                      setBasicForm({
                        firstName: nameParts[0] || "",
                        lastName: nameParts.slice(1).join(" "),
                        phone: profile?.phone || "",
                        linkedin: profile?.linkedin || "",
                      });
                      setIsEditProfileOpen(true);
                    }}>
                      <PenSquare className="h-3.5 w-3.5" />
                      Edit Profile
                    </Button>
                  </div>
                </div>

                {/* Grid */}
                <div className="grid gap-5 lg:grid-cols-3">
                  {/* Main — 2 cols */}
                  <div className="space-y-5 lg:col-span-2">

                    {/* Work Experience */}
                    <SectionCard
                      title="Work Experience"
                      icon={<Briefcase className="h-4 w-4" />}
                      action={
                        <button
                          onClick={openAddExp}
                          className="flex items-center gap-1 rounded border border-[#D1D5DB] bg-[#F9FAFB] px-2.5 py-1 text-xs text-[#374151] transition hover:border-[#1D4ED8] hover:text-[#1D4ED8]"
                        >
                          <Plus className="h-3 w-3" /> Add Role
                        </button>
                      }
                    >
                      {workExperiences.length === 0 ? (
                        <div className="px-5 py-8 text-center text-sm text-[#6B7280]">
                          No work experience yet.{" "}
                          <button onClick={openAddExp} className="text-[#1D4ED8] hover:underline">Add one</button>
                        </div>
                      ) : (
                        <div className="divide-y divide-[var(--border-light)]">
                          {workExperiences.map((exp) => {
                            const highlights = exp.highlights
                              ? (JSON.parse(exp.highlights) as string[])
                              : [];
                            return (
                              <div key={exp.id} className="group px-5 py-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h3 className="text-sm font-semibold text-[#111827]">{exp.role}</h3>
                                      {formatDuration(exp) && (
                                        <span className="rounded border border-[var(--border-light)] bg-[#F9FAFB] px-1.5 py-0.5 text-[10px] font-medium text-[#6B7280]">
                                          {formatDuration(exp)}
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-0.5 text-xs font-medium text-[#374151]">{exp.company}</p>
                                    {highlights.length > 0 && (
                                      <ul className="mt-3 space-y-1.5">
                                        {highlights.map((h, i) => (
                                          <li key={i} className="flex items-start gap-2 text-xs text-[#374151]">
                                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#166534]" />
                                            <span>{h}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                                    <button
                                      className="rounded border border-[var(--border-light)] p-1.5 text-[#6B7280] transition hover:text-[#1D4ED8]"
                                      onClick={() => openEditExp(exp)}
                                    >
                                      <PenSquare className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      className="rounded border border-[var(--border-light)] p-1.5 text-[#6B7280] transition hover:text-red-600"
                                      onClick={() => handleDeleteExp(exp.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </SectionCard>

                    {/* Education */}
                    <SectionCard
                      title="Education"
                      icon={<GraduationCap className="h-4 w-4" />}
                      action={
                        <button
                          onClick={openAddEdu}
                          className="flex items-center gap-1 rounded border border-[#D1D5DB] bg-[#F9FAFB] px-2.5 py-1 text-xs text-[#374151] transition hover:border-[#1D4ED8] hover:text-[#1D4ED8]"
                        >
                          <Plus className="h-3 w-3" /> Add Education
                        </button>
                      }
                    >
                      {educations.length === 0 ? (
                        <div className="px-5 py-8 text-center text-sm text-[#6B7280]">
                          No education added yet.{" "}
                          <button onClick={openAddEdu} className="text-[#1D4ED8] hover:underline">Add one</button>
                        </div>
                      ) : (
                        <div className="divide-y divide-[var(--border-light)]">
                          {educations.map((edu) => (
                            <div key={edu.id} className="group flex items-start justify-between px-5 py-4">
                              <div className="flex-1">
                                <h3 className="text-sm font-semibold text-[#111827]">{edu.school}</h3>
                                <p className="mt-0.5 text-xs text-[#374151]">{edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}</p>
                                {edu.graduationYear && (
                                  <p className="mt-1 text-xs text-[#6B7280]">Graduated {edu.graduationYear}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                                <button
                                  className="rounded border border-[var(--border-light)] p-1.5 text-[#6B7280] transition hover:text-[#1D4ED8]"
                                  onClick={() => openEditEdu(edu)}
                                >
                                  <PenSquare className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  className="rounded border border-[var(--border-light)] p-1.5 text-[#6B7280] transition hover:text-red-600"
                                  onClick={() => handleDeleteEdu(edu.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </SectionCard>

                    {/* Skills */}
                    <SectionCard
                      title="Skills & Expertise"
                      icon={<Award className="h-4 w-4" />}
                      action={
                        <button
                          onClick={() => setIsManageSkillsOpen(true)}
                          className="flex items-center gap-1 rounded border border-[#D1D5DB] bg-[#F9FAFB] px-2.5 py-1 text-xs text-[#374151] transition hover:border-[#1D4ED8] hover:text-[#1D4ED8]"
                        >
                          <PenSquare className="h-3 w-3" /> Manage
                        </button>
                      }
                    >
                      {skills.length === 0 ? (
                        <div className="px-5 py-8 text-center text-sm text-[#6B7280]">
                          No skills added yet.{" "}
                          <button onClick={() => setIsManageSkillsOpen(true)} className="text-[#1D4ED8] hover:underline">Add skills</button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 p-5">
                          {skills.map((skill) => (
                            <span
                              key={skill.id}
                              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium ${
                                skill.skillLevel === "Expert"
                                  ? "bg-[#EFF6FF] text-[#1D4ED8]"
                                  : "bg-[#F3F4F6] text-[#374151]"
                              }`}
                            >
                              {skill.skillName}
                              <span className={`text-[10px] ${skill.skillLevel === "Expert" ? "text-[#60A5FA]" : "text-[#9CA3AF]"}`}>
                                {skill.skillLevel}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </SectionCard>
                  </div>

                  {/* Sidebar — 1 col */}
                  <div className="space-y-5">
                    {/* Resume */}
                    <SectionCard title="Resume" icon={<FileText className="h-4 w-4" />}>
                      <div className="p-5 space-y-3">
                        {profile?.resumeUrl ? (
                          <div className="flex items-center gap-3 rounded border border-[var(--border-light)] bg-[#F9FAFB] p-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#FEE2E2]">
                              <File className="h-4 w-4 text-[#DC2626]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#1D4ED8] truncate hover:underline block">
                                View Resume
                              </a>
                              <p className="text-[10px] text-[#6B7280]">Current resume on file</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-[#6B7280]">No resume uploaded yet.</p>
                        )}
                        <button
                          onClick={() => setResumeUploadState("selecting")}
                          className="flex w-full items-center justify-center gap-1.5 rounded border border-[#D1D5DB] bg-white px-3 py-2 text-xs font-medium text-[#374151] transition hover:border-[#1D4ED8] hover:text-[#1D4ED8]"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          {profile?.resumeUrl ? "Upload New Resume" : "Upload Resume"}
                        </button>
                      </div>
                    </SectionCard>

                    {/* Preferences */}
                    <SectionCard
                      title="Career Preferences"
                      icon={<Target className="h-4 w-4" />}
                      action={
                        <button
                          onClick={openPreferences}
                          className="flex items-center gap-1 rounded border border-[#D1D5DB] bg-[#F9FAFB] px-2.5 py-1 text-xs text-[#374151] transition hover:border-[#1D4ED8] hover:text-[#1D4ED8]"
                        >
                          <PenSquare className="h-3 w-3" /> Edit
                        </button>
                      }
                    >
                      <div className="divide-y divide-[var(--border-light)]">
                        {[
                          { icon: <Target className="h-3.5 w-3.5" />, label: "Target Salary", value: profile?.targetSalary || "—" },
                          { icon: <MapPin className="h-3.5 w-3.5" />, label: "Preferred Location", value: profile?.preferredLocation || "—" },
                          { icon: <Briefcase className="h-3.5 w-3.5" />, label: "Notice Period", value: profile?.noticePeriod != null ? `${profile.noticePeriod} days` : "—" },
                        ].map((item, i) => (
                          <div key={i} className="px-5 py-3">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-[#111827]">
                              <span className="text-[#6B7280]">{item.icon}</span>
                              {item.label}
                            </div>
                            <p className="mt-1 text-xs text-[#374151]">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  </div>
                </div>
              </div>
            )}

            {/* ══ MODALS ══ */}

            {/* Toast Notification */}
            {showToast && (
              <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 shadow-lg">
                <CheckCircle2 className="h-4 w-4 text-[#166534]" />
                <p className="text-sm font-medium text-[#166534]">{toastMessage}</p>
              </div>
            )}

            {/* 1. Edit Basic Profile */}
            {step === "complete" && isEditProfileOpen && (
              <Modal
                title="Edit Basic Information"
                onClose={() => setIsEditProfileOpen(false)}
                footer={
                  <>
                    <Button variant="outline" onClick={() => setIsEditProfileOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveEditProfile} disabled={saving}>
                      {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                      Save Changes
                    </Button>
                  </>
                }
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="First Name">
                    <input
                      type="text"
                      className={inputCls}
                      value={basicForm.firstName}
                      onChange={(e) => setBasicForm((f) => ({ ...f, firstName: e.target.value }))}
                    />
                  </FormField>
                  <FormField label="Last Name">
                    <input
                      type="text"
                      className={inputCls}
                      value={basicForm.lastName}
                      onChange={(e) => setBasicForm((f) => ({ ...f, lastName: e.target.value }))}
                    />
                  </FormField>
                  <FormField label="Email Address">
                    <input type="email" className={inputCls} value={profile?.email ?? ""} disabled />
                  </FormField>
                  <FormField label="Phone Number">
                    <input
                      type="tel"
                      className={inputCls}
                      value={basicForm.phone}
                      onChange={(e) => setBasicForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </FormField>
                  <FormField label="Country">
                    <select value={locCountry} onChange={(e) => handleCountryChange(e.target.value as CountryCode | "")} className={inputCls}>
                      <option value="">Select country…</option>
                      {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Province / State">
                    <select value={locRegion} onChange={(e) => handleRegionChange(e.target.value)} disabled={!locCountry} className={`${inputCls} disabled:opacity-50`}>
                      <option value="">Select province/state…</option>
                      {locCountry && REGIONS[locCountry].map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
                    </select>
                  </FormField>
                  <div className="sm:col-span-2">
                    <FormField label="City">
                      <select value={locCity} onChange={(e) => setLocCity(e.target.value)} disabled={!locRegion} className={`${inputCls} disabled:opacity-50`}>
                        <option value="">Select city…</option>
                        {locCountry && locRegion && (CITIES[locCountry][locRegion] ?? []).map((city) => <option key={city} value={city}>{city}</option>)}
                      </select>
                    </FormField>
                  </div>
                  <div className="sm:col-span-2">
                    <FormField label="LinkedIn Profile URL">
                      <input
                        type="url"
                        className={inputCls}
                        value={basicForm.linkedin}
                        onChange={(e) => setBasicForm((f) => ({ ...f, linkedin: e.target.value }))}
                      />
                    </FormField>
                  </div>
                </div>
              </Modal>
            )}

            {/* 2. Re-Upload Resume Flow */}
            {step === "complete" && resumeUploadState !== "hidden" && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                {resumeUploadState === "selecting" && (
                  <div className="w-full max-w-lg overflow-hidden rounded-lg border border-[var(--border-light)] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
                    <div className="flex items-center justify-between border-b border-[var(--border-light)] px-6 py-4">
                      <h3 className="text-base font-semibold text-[#111827]">Upload New Resume</h3>
                      <button onClick={() => setResumeUploadState("hidden")} className="rounded p-1 text-[#6B7280] hover:bg-[#F3F4F6]">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="p-6">
                      <div
                        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#D1D5DB] bg-[#F9FAFB] p-12 transition hover:border-[#1D4ED8] hover:bg-[#EFF6FF]/20"
                        onClick={handleReuploadSimulate}
                      >
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-white border border-[var(--border-light)]">
                          <Upload className="h-5 w-5 text-[#1D4ED8]" />
                        </div>
                        <h3 className="text-sm font-semibold text-[#111827]">Click to browse</h3>
                        <p className="mt-1 text-xs text-[#6B7280]">Upload an updated PDF or DOCX</p>
                      </div>
                    </div>
                  </div>
                )}
                {resumeUploadState === "parsing" && (
                  <div className="w-full max-w-sm rounded-lg border border-[var(--border-light)] bg-white p-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
                    <Loader2 className="mx-auto mb-4 h-9 w-9 animate-spin text-[#1D4ED8]" />
                    <h3 className="text-base font-semibold text-[#111827]">Analyzing Update...</h3>
                    <p className="mt-2 text-xs text-[#6B7280]">Uploading and extracting your latest experience...</p>
                    {parseError && <p className="mt-4 text-xs text-red-600 font-medium">Error: {parseError}</p>}
                  </div>
                )}
                {resumeUploadState === "overwrite-prompt" && (
                  <div className="w-full max-w-lg overflow-hidden rounded-lg border border-[var(--border-light)] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
                    <div className="border-b border-[var(--border-light)] px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#FFFBEB]">
                          <AlertTriangle className="h-5 w-5 text-[#92400E]" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-[#111827]">New Resume Processed</h3>
                          <p className="text-xs text-[#6B7280]">Choose how to apply the new data</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="mb-4 text-sm text-[#374151]">
                        We found new data in your uploaded resume. Do you want our AI to automatically overwrite your current profile sections, or just attach the file?
                      </p>
                      <div className="space-y-2.5">
                        <button onClick={handleApplyOverwrite} className="flex w-full items-start gap-3 rounded border-2 border-[#1D4ED8] bg-[#EFF6FF] p-4 text-left transition hover:bg-[#DBEAFE]">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#1D4ED8]">
                            <RotateCcw className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#111827]">Update module contents</p>
                            <p className="mt-0.5 text-xs text-[#374151]">Replace my current Work Experience, Education, and Skills with the data from this new file.</p>
                          </div>
                        </button>
                        <button onClick={handleKeepManual} className="flex w-full items-start gap-3 rounded border border-[var(--border-light)] bg-white p-4 text-left transition hover:bg-[#F9FAFB]">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#F3F4F6]">
                            <FileText className="h-4 w-4 text-[#374151]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#111827]">Keep my current profile data</p>
                            <p className="mt-0.5 text-xs text-[#374151]">Just attach the new file. Leave my manually edited modules exactly as they are.</p>
                          </div>
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-center border-t border-[var(--border-light)] bg-[#F9FAFB] px-6 py-4">
                      <Button variant="outline" onClick={() => setResumeUploadState("hidden")}>Cancel Upload</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. Add/Edit Work Experience Modal */}
            {step === "complete" && isAddRoleOpen && (
              <Modal
                title={editingExp ? "Edit Work Experience" : "Add Work Experience"}
                onClose={() => setIsAddRoleOpen(false)}
                footer={
                  <>
                    <Button variant="outline" onClick={() => setIsAddRoleOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveExp} disabled={saving || !expForm.role || !expForm.company}>
                      {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                      Save
                    </Button>
                  </>
                }
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <FormField label="Job Title *">
                      <input type="text" className={inputCls} placeholder="e.g. Senior Software Engineer" value={expForm.role} onChange={(e) => setExpForm((f) => ({ ...f, role: e.target.value }))} />
                    </FormField>
                  </div>
                  <div className="sm:col-span-2">
                    <FormField label="Company Name *">
                      <input type="text" className={inputCls} placeholder="e.g. Acme Corp" value={expForm.company} onChange={(e) => setExpForm((f) => ({ ...f, company: e.target.value }))} />
                    </FormField>
                  </div>
                  <FormField label="Start Date">
                    <input type="month" className={inputCls} value={expForm.startDate} onChange={(e) => setExpForm((f) => ({ ...f, startDate: e.target.value }))} />
                  </FormField>
                  <FormField label="End Date">
                    <input type="month" className={inputCls} value={expForm.endDate} onChange={(e) => setExpForm((f) => ({ ...f, endDate: e.target.value }))} disabled={expForm.isCurrent} />
                    <div className="mt-1.5 flex items-center gap-2">
                      <input type="checkbox" id="currentRole" className="rounded border-[#D1D5DB]" checked={expForm.isCurrent} onChange={(e) => setExpForm((f) => ({ ...f, isCurrent: e.target.checked }))} />
                      <label htmlFor="currentRole" className="text-xs text-[#374151]">I currently work here</label>
                    </div>
                  </FormField>
                  <div className="sm:col-span-2">
                    <FormField label="Description / Highlights (one per line)">
                      <textarea
                        rows={5}
                        className={inputCls}
                        placeholder={"• Led the development of...\n• Increased conversion rate by..."}
                        value={expForm.highlights}
                        onChange={(e) => setExpForm((f) => ({ ...f, highlights: e.target.value }))}
                      />
                      <p className="mt-1 text-xs text-[#6B7280]">Each line becomes a separate bullet point.</p>
                    </FormField>
                  </div>
                </div>
              </Modal>
            )}

            {/* 4. Add/Edit Education Modal */}
            {step === "complete" && isAddEducationOpen && (
              <Modal
                title={editingEdu ? "Edit Education" : "Add Education"}
                maxWidth="max-w-xl"
                onClose={() => setIsAddEducationOpen(false)}
                footer={
                  <>
                    <Button variant="outline" onClick={() => setIsAddEducationOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveEdu} disabled={saving || !eduForm.school || !eduForm.degree}>
                      {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                      Save
                    </Button>
                  </>
                }
              >
                <div className="grid gap-4">
                  <FormField label="School / University *">
                    <input type="text" className={inputCls} placeholder="e.g. Stanford University" value={eduForm.school} onChange={(e) => setEduForm((f) => ({ ...f, school: e.target.value }))} />
                  </FormField>
                  <FormField label="Degree or Certificate *">
                    <input type="text" className={inputCls} placeholder="e.g. BSc, High School Diploma" value={eduForm.degree} onChange={(e) => setEduForm((f) => ({ ...f, degree: e.target.value }))} />
                  </FormField>
                  <FormField label="Field of Study (Optional)">
                    <input type="text" className={inputCls} placeholder="e.g. Computer Science" value={eduForm.fieldOfStudy} onChange={(e) => setEduForm((f) => ({ ...f, fieldOfStudy: e.target.value }))} />
                  </FormField>
                  <FormField label="Graduation Year (Optional)">
                    <input type="number" className={inputCls} placeholder="e.g. 2020" min={1970} max={2030} value={eduForm.graduationYear} onChange={(e) => setEduForm((f) => ({ ...f, graduationYear: e.target.value }))} />
                  </FormField>
                </div>
              </Modal>
            )}

            {/* 5. Manage Skills Modal */}
            {step === "complete" && isManageSkillsOpen && (
              <Modal
                title="Manage Skills"
                maxWidth="max-w-xl"
                onClose={() => setIsManageSkillsOpen(false)}
                footer={
                  <Button variant="outline" onClick={() => setIsManageSkillsOpen(false)}>Done</Button>
                }
              >
                <div className="space-y-4">
                  {skills.length > 0 ? (
                    <>
                      <p className="text-xs text-[#6B7280]">Your current skills (click × to remove):</p>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <span
                            key={skill.id}
                            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium ${
                              skill.skillLevel === "Expert"
                                ? "bg-[#EFF6FF] text-[#1D4ED8]"
                                : "bg-[#F3F4F6] text-[#374151]"
                            }`}
                          >
                            {skill.skillName}
                            <span className={`text-[10px] ${skill.skillLevel === "Expert" ? "text-[#60A5FA]" : "text-[#9CA3AF]"}`}>
                              {skill.skillLevel}
                            </span>
                            <button onClick={() => handleDeleteSkill(skill.id)} className="ml-0.5 text-[#9CA3AF] hover:text-red-500 transition">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-[#6B7280]">No skills yet. Add some below.</p>
                  )}

                  <div className="border-t border-[var(--border-light)] pt-4">
                    <p className="text-xs font-medium text-[#374151] mb-2">Add a skill</p>
                    <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                      <input
                        type="text"
                        className={inputCls}
                        placeholder="e.g. React"
                        value={newSkillName}
                        onChange={(e) => setNewSkillName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && newSkillName.trim()) handleAddSkill(); }}
                      />
                      <select
                        className={inputCls}
                        value={newSkillLevel}
                        onChange={(e) => setNewSkillLevel(e.target.value as any)}
                      >
                        <option value="Expert">Expert</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Beginner">Beginner</option>
                      </select>
                      <Button
                        onClick={handleAddSkill}
                        disabled={!newSkillName.trim() || saving}
                        size="sm"
                      >
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </Modal>
            )}

            {/* 6. Edit Preferences Modal */}
            {step === "complete" && isEditPreferencesOpen && (
              <Modal
                title="Edit Career Preferences"
                maxWidth="max-w-xl"
                onClose={() => setIsEditPreferencesOpen(false)}
                footer={
                  <>
                    <Button variant="outline" onClick={() => setIsEditPreferencesOpen(false)}>Cancel</Button>
                    <Button onClick={handleSavePreferences} disabled={saving}>
                      {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                      Save Preferences
                    </Button>
                  </>
                }
              >
                <div className="grid gap-4">
                  <FormField label="Target Salary">
                    <input
                      type="text"
                      className={inputCls}
                      placeholder="e.g. CA$150,000"
                      value={prefForm.targetSalary}
                      onChange={(e) => setPrefForm((f) => ({ ...f, targetSalary: e.target.value }))}
                    />
                  </FormField>
                  <FormField label="Preferred Location">
                    <input
                      type="text"
                      className={inputCls}
                      placeholder="e.g. Toronto, Canada or Remote"
                      value={prefForm.preferredLocation}
                      onChange={(e) => setPrefForm((f) => ({ ...f, preferredLocation: e.target.value }))}
                    />
                  </FormField>
                  <FormField label="Notice Period (days)">
                    <input
                      type="number"
                      className={inputCls}
                      placeholder="e.g. 14"
                      min={0}
                      value={prefForm.noticePeriod}
                      onChange={(e) => setPrefForm((f) => ({ ...f, noticePeriod: e.target.value }))}
                    />
                  </FormField>
                </div>
              </Modal>
            )}
          </>
        )}
      </div>
    </GuestGate>
  );
}
