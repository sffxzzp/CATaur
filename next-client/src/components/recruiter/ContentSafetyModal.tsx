"use client";

import { useEffect, useState } from "react";
import { Shield, X, AlertTriangle, RefreshCw } from "lucide-react";
import type { ContentSafetyResult, Violation } from "@/lib/api/contentSafety";

interface ContentSafetyModalProps {
    isOpen: boolean;
    result: ContentSafetyResult | null;
    onClose: () => void;
    onSubmitAnyway?: () => void;
}

const categoryConfig: Record<string, { icon: string; color: string; bg: string; border: string }> = {
    Hate: {
        icon: "🚫",
        color: "text-red-700",
        bg: "bg-red-50",
        border: "border-red-200",
    },
    Violence: {
        icon: "⚡",
        color: "text-orange-700",
        bg: "bg-orange-50",
        border: "border-orange-200",
    },
    Sexual: {
        icon: "🔞",
        color: "text-pink-700",
        bg: "bg-pink-50",
        border: "border-pink-200",
    },
    SelfHarm: {
        icon: "💙",
        color: "text-purple-700",
        bg: "bg-purple-50",
        border: "border-purple-200",
    },
};

function SeverityDots({ severity }: { severity: number }) {
    // severity 0-6 → map to 4 dots (each dot = 1.5 severity)
    const filled = Math.min(4, Math.round(severity / 1.5));
    return (
        <span className="inline-flex items-center gap-0.5 ml-1">
            {[0, 1, 2, 3].map((i) => (
                <span
                    key={i}
                    className={`inline-block w-2 h-2 rounded-full transition-colors ${i < filled ? "bg-red-500" : "bg-gray-200"
                        }`}
                />
            ))}
        </span>
    );
}

function SeverityLabel({ severity }: { severity: number }) {
    if (severity >= 5) return <span className="text-xs font-semibold text-red-600">Critical</span>;
    if (severity >= 3) return <span className="text-xs font-semibold text-orange-600">High</span>;
    if (severity >= 2) return <span className="text-xs font-semibold text-yellow-600">Medium</span>;
    return <span className="text-xs font-semibold text-gray-500">Low</span>;
}

function ViolationItem({ violation, delay }: { violation: Violation; delay: number }) {
    const [visible, setVisible] = useState(false);
    const cfg = categoryConfig[violation.category] ?? categoryConfig.Hate;

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    return (
        <div
            className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition-all duration-300 ${cfg.bg} ${cfg.border} ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                }`}
        >
            <div className="flex items-center gap-2">
                <span className="text-base leading-none">{cfg.icon}</span>
                <span className={`text-sm font-semibold ${cfg.color}`}>{violation.label}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <SeverityLabel severity={violation.severity} />
                <SeverityDots severity={violation.severity} />
            </div>
        </div>
    );
}

export function ContentSafetyModal({
    isOpen,
    result,
    onClose,
    onSubmitAnyway,
}: ContentSafetyModalProps) {
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            // Small delay to allow mount before animation starts
            const t = setTimeout(() => setVisible(true), 10);
            return () => clearTimeout(t);
        } else {
            setVisible(false);
            const t = setTimeout(() => setMounted(false), 300);
            return () => clearTimeout(t);
        }
    }, [isOpen]);

    if (!mounted || !result) return null;

    const hasTitle = result.titleResult && result.titleResult.violations.length > 0;
    const hasDescription = result.descriptionResult && result.descriptionResult.violations.length > 0;

    let violationDelay = 150;

    return (
        <div
            className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300 ${visible ? "opacity-100" : "opacity-0"
                }`}
            style={{ backdropFilter: visible ? "blur(4px)" : "blur(0px)" }}
            onClick={onClose}
            aria-modal="true"
            role="dialog"
            aria-label="Content Policy Violation"
        >
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black transition-opacity duration-300 ${visible ? "opacity-40" : "opacity-0"
                    }`}
            />

            {/* Modal */}
            <div
                className={`relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 ${visible
                        ? "opacity-100 scale-100 translate-y-0"
                        : "opacity-0 scale-95 translate-y-4"
                    }`}
                style={{
                    boxShadow: visible
                        ? "0 0 0 1.5px #ef4444, 0 0 40px rgba(239,68,68,0.18), 0 25px 50px rgba(0,0,0,0.25)"
                        : "none",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100 px-6 py-4">
                    <div className="flex items-center gap-3">
                        {/* Animated shield icon */}
                        <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full bg-red-100 transition-transform duration-500 ${visible ? "scale-100" : "scale-0"
                                }`}
                            style={{ animationDelay: "100ms" }}
                        >
                            <Shield className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-red-800">Content Policy Violation</h2>
                            <p className="text-xs text-red-500 mt-0.5">Potentially harmful content detected</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 transition-colors"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5">
                    {/* Info text */}
                    <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-amber-800 leading-relaxed">
                            The content you submitted may violate our community guidelines. Please review and revise the flagged sections before publishing this job order.
                        </p>
                    </div>

                    {/* Job Title violations */}
                    {hasTitle && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-base">📌</span>
                                <h3 className="text-sm font-bold text-gray-800">Job Title</h3>
                            </div>
                            <div className="space-y-2 pl-6">
                                {result.titleResult!.violations.map((v, i) => {
                                    const delay = violationDelay;
                                    violationDelay += 60;
                                    return <ViolationItem key={`title-${i}`} violation={v} delay={delay} />;
                                })}
                            </div>
                        </div>
                    )}

                    {/* Description violations */}
                    {hasDescription && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-base">📋</span>
                                <h3 className="text-sm font-bold text-gray-800">Description</h3>
                            </div>
                            <div className="space-y-2 pl-6">
                                {result.descriptionResult!.violations.map((v, i) => {
                                    const delay = violationDelay;
                                    violationDelay += 60;
                                    return <ViolationItem key={`desc-${i}`} violation={v} delay={delay} />;
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
                    {onSubmitAnyway && (
                        <button
                            onClick={onSubmitAnyway}
                            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors"
                        >
                            Submit Anyway
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Edit Content
                    </button>
                </div>
            </div>
        </div>
    );
}
