"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, MessageSquare, RotateCw, User } from "lucide-react";
import { adminFetch } from "@/lib/adminApi";
import { SkeletonList } from "@/components/ui/Skeleton";

type ChatMessage = {
  id: string;
  text: string;
  senderKind: "teacher" | "student";
  senderName: string;
  time: string;
  status?: string;
};

type ChatThread = {
  id: string;
  staffId: string;
  staffName: string;
  studentId: string;
  studentName: string;
  messageCount: number;
  lastMessage: string;
  lastTime: string;
  messages: ChatMessage[];
};

function formatChatTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  schoolId: string;
  studentId: string;
  studentName?: string;
};

export default function StudentTeacherChatsPanel({ schoolId, studentId, studentName }: Props) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");

  const load = useCallback(async () => {
    if (!schoolId || !studentId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ schoolId });
      const res = await adminFetch(
        `/api/admin/students/${encodeURIComponent(studentId)}/messages?${params}`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load chats");
      const list = Array.isArray(data.threads) ? (data.threads as ChatThread[]) : [];
      setThreads(list);
      setSelectedId((prev) => {
        if (prev && list.some((t) => t.id === prev)) return prev;
        return list[0]?.id || "";
      });
    } catch (err) {
      setThreads([]);
      setSelectedId("");
      setError(err instanceof Error ? err.message : "Failed to load chats");
    } finally {
      setLoading(false);
    }
  }, [schoolId, studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const active = useMemo(
    () => threads.find((t) => t.id === selectedId) || threads[0] || null,
    [threads, selectedId]
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden flex flex-col xl:flex-row min-h-[520px]">
      <div className="w-full xl:w-[300px] border-b xl:border-b-0 xl:border-r border-gray-100 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2 bg-gray-50/50">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Teacher chats
            </h3>
            <p className="text-[10px] font-semibold text-gray-400 mt-0.5">
              {threads.length} conversation{threads.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="h-8 w-8 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 inline-flex items-center justify-center"
            title="Refresh"
          >
            <RotateCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[420px] xl:max-h-none divide-y divide-gray-50">
          {loading ? (
            <SkeletonList rows={5} />
          ) : error ? (
            <div className="p-6 text-center">
              <AlertCircle className="mx-auto text-rose-400 mb-2" size={22} />
              <p className="text-xs font-bold text-rose-600">{error}</p>
            </div>
          ) : threads.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="mx-auto text-gray-300 mb-2" size={24} />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                No teacher chats yet
              </p>
            </div>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => setSelectedId(thread.id)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                  active?.id === thread.id ? "bg-[#144835]/5" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-[#144835]/10 text-[#144835] flex items-center justify-center shrink-0">
                    <User size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-extrabold text-gray-900 truncate">
                        {thread.staffName}
                      </p>
                      <span className="text-[10px] font-semibold text-gray-400 shrink-0">
                        {formatChatTime(thread.lastTime)}
                      </span>
                    </div>
                    <p className="text-[10px] font-semibold text-gray-400 mt-0.5">
                      {thread.messageCount} message{thread.messageCount === 1 ? "" : "s"}
                    </p>
                    <p className="text-[11px] font-medium text-gray-600 mt-1 line-clamp-2">
                      {thread.lastMessage || "—"}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-[360px]">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/40">
          {active ? (
            <>
              <p className="text-sm font-extrabold text-gray-900">{active.staffName}</p>
              <p className="text-[10px] font-semibold text-gray-400 mt-0.5">
                Chat with {studentName || active.studentName || "student"} ·{" "}
                {active.messageCount} messages
              </p>
            </>
          ) : (
            <p className="text-sm font-bold text-gray-500">Select a teacher conversation</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafb]">
          {!active ? (
            <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center">
              <MessageSquare className="text-gray-300 mb-2" size={28} />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                No conversation selected
              </p>
            </div>
          ) : active.messages.length === 0 ? (
            <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                Empty conversation
              </p>
            </div>
          ) : (
            active.messages.map((msg) => {
              const fromStudent = msg.senderKind === "student";
              return (
                <div
                  key={msg.id}
                  className={`flex ${fromStudent ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                      fromStudent
                        ? "bg-[#144835] text-white rounded-br-md"
                        : "bg-white border border-gray-100 text-gray-800 rounded-bl-md"
                    }`}
                  >
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${
                        fromStudent ? "text-emerald-100" : "text-gray-400"
                      }`}
                    >
                      {msg.senderName || (fromStudent ? "Student" : "Teacher")}
                    </p>
                    <p className="text-xs font-medium whitespace-pre-wrap break-words">
                      {msg.text}
                    </p>
                    <p
                      className={`text-[10px] font-semibold mt-1.5 ${
                        fromStudent ? "text-emerald-100/80" : "text-gray-400"
                      }`}
                    >
                      {formatChatTime(msg.time)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
