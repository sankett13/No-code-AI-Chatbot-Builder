"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type Bot = {
  id: string;
  name: string;
  instructions?: string | null;
  color?: string | null;
  knowledge_file_name?: string | null;
  processing_status?: string | null;
  chunks_count?: number | null;
  created_at?: string | null;
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBot, setActiveBot] = useState<Bot | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  const [messages, setMessages] = useState<
    { from: "user" | "bot"; text: string }[]
  >([]);
  const [input, setInput] = useState("");
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function loadBots() {
      setLoading(true);
      setError(null);

      try {
        // Prefer using the API route which validates token server-side
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push("/login");
          return;
        }

        const res = await fetch("/api/bots", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!res.ok) {
          // fallback to direct supabase client if API fails
          console.warn("/api/bots failed, falling back to client query");
          const { data: clientBots, error: clientErr } = await supabase
            .from("bots")
            .select(
              "id, name, instructions, color, knowledge_file_name, processing_status, chunks_count, created_at, updated_at"
            )
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false });

          if (clientErr) throw clientErr;
          if (!mounted) return;
          setBots((clientBots as any) ?? []);
          return;
        }

        const payload = await res.json();
        if (!mounted) return;
        setBots(payload.bots ?? []);
      } catch (err: any) {
        console.error("Failed to load bots", err);
        setError(err?.message ?? "Failed to load bots");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadBots();
    return () => {
      mounted = false;
    };
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  async function handleDelete(botId: string) {
    if (!confirm("Delete this bot? This action cannot be undone.")) return;
    try {
      const { error } = await supabase.from("bots").delete().eq("id", botId);
      if (error) throw error;
      setBots((b) => b.filter((x) => x.id !== botId));
    } catch (err: any) {
      console.error("Failed to delete bot", err);
      alert(err?.message || "Failed to delete bot");
    }
  }

  function openTest(bot: Bot) {
    setActiveBot(bot);
    setMessages([
      { from: "bot", text: `Ready to test ${bot.name}. Type a message below.` },
    ]);
    setInput("");
    setTestOpen(true);
  }

  async function sendTestMessage() {
    if (!input.trim() || !activeBot) return;
    const text = input.trim();
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");

    try {
      // try calling the existing chat API if present
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ bot_id: activeBot.id, message: text }),
        });

        if (res.ok) {
          const payload = await res.json();
          const reply =
            payload?.reply ?? payload?.message ?? JSON.stringify(payload);
          setMessages((m) => [...m, { from: "bot", text: String(reply) }]);
          return;
        }
      }

      // fallback mock reply (no /api/chat implemented)
      const fallback = activeBot.instructions
        ? `(${activeBot.name}) ${activeBot.instructions}\nResponse (mock): I heard: "${text}"`
        : `(${activeBot.name}) Response (mock): I heard: "${text}"`;

      setTimeout(() => {
        setMessages((m) => [...m, { from: "bot", text: fallback }]);
      }, 600);
    } catch (err: any) {
      console.error("Test message failed", err);
      setMessages((m) => [
        ...m,
        { from: "bot", text: "Error: failed to get reply" },
      ]);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Checking authentication…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Please sign in</h2>
          <p className="text-sm text-slate-600 mt-2">
            You must be logged in to view your dashboard.
          </p>
          <div className="mt-4">
            <button
              onClick={() => (window.location.href = "/login")}
              className="px-4 py-2 bg-indigo-600 text-white rounded"
            >
              Go to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">{user.email}</span>
            <button
              onClick={handleSignOut}
              className="px-3 py-1 border rounded text-sm"
            >
              Sign out
            </button>
          </div>
        </header>

        <section className="bg-white p-6 rounded shadow">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-medium mb-2">Your bots</h2>
              <p className="text-sm text-gray-700">
                Manage, edit, delete or test your bots from here.
              </p>
            </div>
            <div>
              <a
                href="/dashboard/create-bot"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
              >
                Create bot
              </a>
            </div>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="text-sm text-slate-600">Loading bots…</div>
            ) : error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : bots.length === 0 ? (
              <div className="text-sm text-slate-600">
                No bots yet. Create one to get started.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {bots.map((bot) => (
                  <div
                    key={bot.id}
                    className="border rounded p-4 flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white"
                        style={{ backgroundColor: bot.color ?? "#374151" }}
                      >
                        {bot.name?.[0] ?? "B"}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{bot.name}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {bot.instructions ?? (
                            <em className="text-slate-400">No instructions</em>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-2">
                          {bot.chunks_count
                            ? `${bot.chunks_count} chunks`
                            : "No chunks"}{" "}
                          • {bot.processing_status ?? "n/a"} •{" "}
                          {bot.created_at
                            ? new Date(bot.created_at).toLocaleString()
                            : "-"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          (window.location.href = `/dashboard/create-bot?edit=${bot.id}`)
                        }
                        className="px-3 py-1 border rounded text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(bot.id)}
                        className="px-3 py-1 border rounded text-sm text-red-600"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => openTest(bot)}
                        className="px-3 py-1 bg-indigo-600 text-white rounded text-sm"
                      >
                        Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Test modal */}
      {testOpen && activeBot && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="w-full max-w-2xl bg-white rounded shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: activeBot.color ?? "#111827" }}
                >
                  {activeBot.name?.[0] ?? "B"}
                </div>
                <div>
                  <div className="font-semibold">{activeBot.name}</div>
                  <div className="text-xs text-slate-500">
                    {activeBot.knowledge_file_name ?? "No knowledge file"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTestOpen(false)}
                  className="px-3 py-1 border rounded"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="border rounded p-3 h-72 overflow-y-auto bg-slate-50 space-y-2">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={m.from === "user" ? "text-right" : "text-left"}
                >
                  <div
                    className={`${
                      m.from === "user"
                        ? "inline-block bg-indigo-600 text-white"
                        : "inline-block bg-white text-slate-800"
                    } px-3 py-2 rounded-lg`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 border rounded px-3 py-2"
                placeholder="Type a message to the bot"
              />
              <button
                onClick={sendTestMessage}
                className="px-4 py-2 bg-indigo-600 text-white rounded"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
