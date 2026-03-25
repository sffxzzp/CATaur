"use client";

import { useCallback, useEffect, useState } from "react";
import { BrainCircuit, Trash2, RefreshCw, Eye, EyeOff, X } from "lucide-react";
import { request } from "@/lib/request";
import { toast } from "sonner";

/* ─── Static config ───────────────────────────────────────────────────────── */
const BUILTIN_PROVIDERS = [
    { id: "openai", label: "OpenAI", placeholder: "sk-…" },
    { id: "anthropic", label: "Anthropic", placeholder: "sk-ant-…" },
    { id: "google", label: "Google", placeholder: "AIza…" },
];

/* ─── API types ───────────────────────────────────────────────────────────── */
type ProviderConfig = {
    provider: string;
    apiKey?: string;
    defaultModel?: string;
    enabled?: boolean;
    [key: string]: unknown;
};

type ProviderModelsResponse = {
    provider: string;
    models: string[];
    defaultModel?: string;
    enabled?: boolean;
    updatedAt: number;
};

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function AIProviderConfigPage() {
    const [provider, setProvider] = useState("openai");
    const [key, setKey] = useState("");
    const [maskedKey, setMaskedKey] = useState("");
    const [model, setModel] = useState("");
    const [models, setModels] = useState<Record<string, ProviderModelsResponse>>({});
    const [enabled, setEnabled] = useState(false);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [refreshingModels, setRefreshingModels] = useState(false);
    const [resetConfirm, setResetConfirm] = useState(false);
    const [showKey, setShowKey] = useState(false);

    const currentProvider = BUILTIN_PROVIDERS.find(p => p.id === provider) ?? BUILTIN_PROVIDERS[0];

    const loadModels = useCallback(async (id: string, { testKey = "" } = {}) => {
        try {
            const path = `/admin/ai-providers/${id}/models/refresh`;

            const options: any = {
                method: "POST",
                json: {
                    apiKey: testKey || undefined,
                },
            };

            const data = await request<ProviderModelsResponse>(path, options);
            if (data?.models) {
                setModels((prev) => ({ ...prev, [id]: data }));
                setModel(current => {
                    if (!current || !data.models.includes(current)) {
                        return data.defaultModel ?? data.models[0] ?? "";
                    }
                    return current;
                });
                if (data.enabled !== undefined) {
                    setEnabled(data.enabled);
                }
            }
            return true;
        } catch (err: any) {
            if (err.status !== 404) {
                toast.error(err.message ?? "Failed to load models.");
            }
            return false;
        }
    }, []);

    /* ── GET /admin/ai-providers/{provider} ── */
    const loadProvider = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const data = await request<ProviderConfig>(`/admin/ai-providers/${id}`);
            const fetchedKey = data?.apiKey ?? "";
            setMaskedKey(fetchedKey);
            setKey(fetchedKey);
            setModel(data?.defaultModel ?? "");
            setEnabled(data?.enabled ?? false);

            if (fetchedKey) {
                loadModels(id);
            } else {
                setModels((prev) => {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                });
            }
        } catch (err: any) {
            if (err.status !== 404) {
                toast.error(err.message ?? "Failed to load provider.");
            }
            setKey("");
            setMaskedKey("");
            setModel("");
            setEnabled(false);
        } finally {
            setLoading(false);
        }
    }, [loadModels]);

    useEffect(() => { loadProvider(provider); }, [provider, loadProvider]);

    useEffect(() => {
        if (!key || key === maskedKey || key.includes('****')) {
            return;
        }

        const timer = setTimeout(async () => {
            setRefreshingModels(true);
            try {
                await loadModels(provider, { testKey: key });
            } catch (err: any) {
                toast.error(err.message ?? "Failed to connect with new key.");
            } finally {
                setRefreshingModels(false);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [key, maskedKey, provider, loadModels]);

    const handleSave = async () => {
        if (!key.trim()) {
            toast.error("API Key is required.");
            return;
        }
        if (!model.trim()) {
            toast.error("Please select a Default Model. You may need to refresh models first.");
            return;
        }

        setSaving(true);
        let finalKey = key;
        if (key === maskedKey || key.includes('****')) {
            finalKey = "";
        }

        try {
            await request(`/admin/ai-providers/${provider}`, {
                method: "PUT",
                json: {
                    provider,
                    apiKey: finalKey || undefined,
                    defaultModel: model,
                },
            });

            if (key.trim()) {
                await loadModels(provider, { testKey: finalKey });
            } else {
                setModels((prev) => {
                    const next = { ...prev };
                    delete next[provider];
                    return next;
                });
            }
            toast.success("Settings saved successfully.");
        } catch (err: any) {
            toast.error(err.message ?? "Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        setResetConfirm(false);
        setLoading(true);
        try {
            const res = await request<{ message?: string }>(`/admin/ai-providers/${provider}`, { method: "DELETE" });
            setKey("");
            setMaskedKey("");
            setModel("");
            setEnabled(false);
            setModels((prev) => {
                const next = { ...prev };
                delete next[provider];
                return next;
            });
            toast.success(res?.message ?? "Provider configuration removed.");
        } catch (err: any) {
            toast.error(err.message ?? "Failed to remove provider.");
        } finally {
            setLoading(false);
        }
    };

    const handleRefreshModels = async () => {
        if (!key.trim()) return;
        setRefreshingModels(true);
        try {
            let realKey = key;
            if (key === maskedKey || key.includes('****')) {
                realKey = "";
            }
            const success = await loadModels(provider, { testKey: realKey });
            if (success) toast.success("Model list refreshed.");
        } finally {
            setRefreshingModels(false);
        }
    };

    const handleEnable = async () => {
        if (!model) return;
        setLoading(true);
        try {
            const res = await request<ProviderConfig>(`/admin/ai-providers/${provider}/enable`, {
                method: "PATCH",
            });
            setEnabled(res.enabled ?? true);
            toast.success(`${currentProvider.label} is now the active AI provider.`);
        } catch (err: any) {
            toast.error(err.message ?? "Failed to enable provider.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-[var(--gray-900)]">AI Provider Config</h1>
                <p className="text-sm text-[var(--gray-500)] mt-1">Securely manage AI provider credentials and model configuration.</p>
            </div>

            <div className="flex flex-wrap gap-2">
                {BUILTIN_PROVIDERS.map(p => (
                    <button key={p.id} onClick={() => { setProvider(p.id); setModel(""); }}
                        className={`rounded-md px-4 py-1.5 text-sm font-medium border transition-colors cursor-pointer ${provider === p.id
                            ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                            : "bg-[var(--surface)] text-[var(--gray-700)] border-[var(--border)] hover:bg-[var(--gray-50)]"}`}>
                        {p.label}
                    </button>
                ))}
            </div>

            <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)]">
                <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--gray-50)] px-5 py-3 flex-wrap">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--accent-light)]">
                        <BrainCircuit className="h-4 w-4 text-[var(--accent)]" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-[var(--gray-900)]">{currentProvider.label} Settings</p>
                        <p className="text-xs text-[var(--gray-500)]">API credentials and model selection</p>
                    </div>

                    <div className="ml-auto flex items-center gap-3">
                        <span className="text-sm font-medium text-[var(--gray-700)]">
                            {enabled ? "Active" : "Inactive"}
                        </span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={enabled}
                            disabled={!model || loading || saving || enabled}
                            onClick={handleEnable}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 ${enabled ? 'bg-[var(--accent)]' : 'bg-gray-200'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={!model ? "Requires Default Model" : (enabled ? "Already active" : "Set as active provider")}
                        >
                            <span className="sr-only">Enable AI Provider</span>
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                <div className={`p-5 space-y-6 transition-opacity ${loading ? "opacity-40 pointer-events-none" : ""}`}>
                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[var(--gray-700)]">API Key <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    type={showKey ? "text" : "password"}
                                    value={key}
                                    onChange={e => setKey(e.target.value)}
                                    placeholder={loading ? "Loading…" : currentProvider.placeholder}
                                    className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 pr-14 text-sm text-[var(--gray-900)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] placeholder:text-[var(--gray-400)]"
                                />
                                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                    {key && (
                                        <button
                                            type="button"
                                            onClick={() => { setKey(""); setMaskedKey(""); }}
                                            className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-700 transition-colors focus:outline-none"
                                            tabIndex={-1}
                                            title="Clear API Key"
                                        >
                                            <X className="h-2.5 w-2.5" strokeWidth={3} />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setShowKey(v => !v)}
                                        className="text-[var(--gray-500)] hover:text-[var(--gray-700)] transition-colors focus:outline-none"
                                        tabIndex={-1}
                                        title={showKey ? "Hide API Key" : "Show API Key"}
                                    >
                                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[var(--gray-700)]">Default Model <span className="text-red-500">*</span></label>
                            <div className="flex items-center gap-2">
                                <select value={model} onChange={e => setModel(e.target.value)}
                                    className="h-9 flex-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--gray-700)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] cursor-pointer">
                                    {(models[provider]?.models ?? []).map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <button
                                    type="button"
                                    onClick={handleRefreshModels}
                                    disabled={loading || saving || refreshingModels || !key.trim()}
                                    className="h-9 flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--gray-700)] shadow-[var(--shadow-sm)] hover:bg-[var(--gray-50)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <RefreshCw className={`h-3.5 w-3.5 ${refreshingModels ? "animate-spin" : ""}`} />
                                    <span>Refresh models</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {provider === "google" && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[var(--gray-700)]">Gemini endpoint</label>
                            <input
                                value="https://generativelanguage.googleapis.com/v1beta/models"
                                readOnly
                                className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--gray-50)] px-3 text-sm text-[var(--gray-500)]"
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] bg-[var(--gray-50)] px-5 py-3 flex-wrap">
                    <button onClick={() => setResetConfirm(true)} disabled={loading || saving || (!key.trim() && !maskedKey)}
                        className="mr-auto flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--danger)] cursor-pointer hover:bg-[var(--danger-bg)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        <Trash2 className="h-3.5 w-3.5" /> Reset
                    </button>

                    <button onClick={handleSave} disabled={loading || saving}
                        className="rounded-md border border-transparent bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-sm)] cursor-pointer hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        {saving ? "Saving…" : "Save settings"}
                    </button>
                </div>
            </div>

            {resetConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="relative w-full max-w-sm rounded-xl bg-[var(--surface)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Setup?</h3>
                            <p className="text-sm text-[var(--gray-500)] mb-6">
                                Are you sure you want to clear credentials for {currentProvider.label}?
                            </p>
                            <div className="flex justify-center gap-3">
                                <button onClick={() => setResetConfirm(false)}
                                    className="px-4 py-2 text-sm font-medium text-[var(--gray-700)] border border-[var(--border)] bg-[var(--surface)] shadow-sm rounded-md hover:bg-[var(--gray-50)] transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleReset}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 shadow-sm rounded-md hover:bg-red-700 transition-colors">
                                    Clear Key
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
