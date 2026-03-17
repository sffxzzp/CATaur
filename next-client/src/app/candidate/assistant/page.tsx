"use client";

import { GuestGate } from "@/components/candidate/guest-gate";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { request } from "@/lib/request";
import ReactMarkdown from "react-markdown";
import { candidateSelfProfileClient } from "@/lib/api/candidate-self-profile";
import type { CandidateProfileExtended } from "@/lib/api/candidate-profile-types";
import { MessageCircle, Send, Sparkles } from "lucide-react";

type Message = {
  role: "assistant" | "user";
  message: string;
  time: string;
};

const QUICK_ACTIONS = [
  "Prepare for system design interview",
  "Review my resume",
  "Salary ranges for Senior Engineer in Toronto",
  "Tips for behavioral interviews",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      message: "Hi! I'm your AI career assistant. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<CandidateProfileExtended | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    candidateSelfProfileClient.getMyProfile().then(setProfile).catch(() => {});
  }, []);

  const buildResumeContext = () => {
    if (!profile) return "";

    const parts = [];
    if (profile.workExperience?.length) {
      parts.push("Work Experience:");
      profile.workExperience.forEach(exp => {
        parts.push(`- ${exp.role} at ${exp.company} (${exp.startDate || ''} - ${exp.isCurrent ? 'Present' : exp.endDate || ''})`);
      });
    }
    if (profile.education?.length) {
      parts.push("\nEducation:");
      profile.education.forEach(edu => {
        parts.push(`- ${edu.degree} in ${edu.fieldOfStudy || ''} from ${edu.school}`);
      });
    }
    if (profile.skills?.length) {
      parts.push("\nSkills:");
      parts.push(profile.skills.map(s => s.skillName).join(", "));
    }
    return parts.join("\n");
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    let finalMessage = messageText;
    if (messageText === "Review my resume" && profile) {
      const resumeContext = buildResumeContext();
      finalMessage = `Review my resume:\n\n${resumeContext}`;
    }

    const userMessage: Message = {
      role: "user",
      message: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await request<{ reply: string }>("/candidate/assistant/chat", {
        method: "POST",
        json: { message: finalMessage },
      });

      const assistantMessage: Message = {
        role: "assistant",
        message: response.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        role: "assistant",
        message: "Sorry, I encountered an error. Please try again.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestGate>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#1D4ED8] to-[#3B82F6]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#111827]">AI Assistant</h1>
            <p className="text-base text-muted-foreground">Get personalized career guidance, interview prep, and more.</p>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border-light)] bg-white">
          <div className="flex items-center gap-2 border-b border-[var(--border-light)] px-5 py-3">
            <MessageCircle className="h-4 w-4 text-[#1D4ED8]" />
            <span className="text-lg font-medium text-[#111827]">AI Chat</span>
          </div>

          <div className="flex h-[600px] flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {messages.map((chat, idx) => (
                <div
                  key={idx}
                  className={`flex ${chat.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-3 ${
                      chat.role === "user"
                        ? "bg-[#1D4ED8] text-white"
                        : "border border-[var(--border-light)] bg-white text-[#111827]"
                    }`}
                  >
                    <div
                      className={`mb-1 flex items-center gap-1.5 text-sm ${
                        chat.role === "user" ? "justify-end text-white/70" : "text-muted-foreground"
                      }`}
                    >
                      {chat.role === "assistant" && <Sparkles className="h-3 w-3" />}
                      <span>{chat.role === "assistant" ? "AI Assistant" : "You"}</span>
                      <span>·</span>
                      <span>{chat.time}</span>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      {chat.role === "assistant" ? (
                        <ReactMarkdown>{chat.message}</ReactMarkdown>
                      ) : (
                        <p className="text-base whitespace-pre-wrap">{chat.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-lg border border-[var(--border-light)] bg-white px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-[#1D4ED8]" style={{ animationDelay: "0ms" }} />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-[#1D4ED8]" style={{ animationDelay: "150ms" }} />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-[#1D4ED8]" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-[var(--border-light)] bg-[#F9FAFB] p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action}
                    onClick={() => handleSend(action)}
                    disabled={loading}
                    className="rounded border border-[#D1D5DB] bg-white px-3 py-1.5 text-sm text-[#374151] transition hover:border-[#1D4ED8] hover:text-[#1D4ED8] disabled:opacity-50"
                  >
                    {action}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Ask me anything about your career..."
                  disabled={loading}
                  className="flex-1 rounded border border-[#D1D5DB] bg-white px-3 py-2 text-base text-[#111827] transition focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 disabled:opacity-50"
                />
                <Button onClick={() => handleSend()} disabled={loading || !input.trim()} size="sm" className="gap-1.5">
                  <Send className="h-3.5 w-3.5" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GuestGate>
  );
}
