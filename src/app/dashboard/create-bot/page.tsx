"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

export default function CreateBotPage() {
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [success, setSuccess] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedExtensions = [".txt", ".pdf", ".doc", ".docx"];
      const ext = selectedFile.name
        .toLowerCase()
        .substring(selectedFile.name.lastIndexOf("."));
      if (!allowedExtensions.includes(ext)) {
        setFileError(
          "Please select a text (.txt), PDF (.pdf), or Word (.doc/.docx) file."
        );
        setFileName(null);
        setFile(null);
        return;
      }
      setFileError(null);
      setFileName(selectedFile.name);
      setFile(selectedFile);
    } else {
      setFileName(null);
      setFile(null);
      setFileError(null);
    }
  }

  function clearFile() {
    setFileName(null);
    setFile(null);
    setFileError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user) {
        throw new Error("You must be logged in to create a bot");
      }

      // Get the current session from Supabase
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("Session expired. Please log in again.");
      }

      const formData = new FormData();
      formData.append("name", name);
      if (instructions) formData.append("instructions", instructions);
      formData.append("color", color);
      if (file) formData.append("file", file);

      const response = await fetch("/api/bots", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create bot");
      }

      setSuccess(true);
      // Reset form
      setName("");
      setInstructions("");
      setColor("#3b82f6");
      setFile(null);
      setFileName(null);

      setTimeout(() => {
        setSuccess(false);
        // Optionally redirect to dashboard or bot management page
        window.location.href = "/dashboard";
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function generateInstructions({
    tone = "friendly",
    length = "concise",
  } = {}) {
    setIsGenerating(true);
    setAiError(null);
    try {
      // get session like you already do
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("Session expired. Please log in again.");
      }

      const res = await fetch("/api/bots/generate-instructions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name,
          existingInstructions: instructions,
          tone,
          length,
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to generate instructions");
      setAiPreview(data.instructions);
      setShowAIPanel(true);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsGenerating(false);
    }
  }

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-10">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 lg:p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-10">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 lg:p-8">
          <div className="text-center">
            <h1 className="text-2xl lg:text-3xl font-extrabold mb-4">
              Authentication Required
            </h1>
            <p className="text-slate-600 mb-6">
              You must be logged in to create a bot. Please log in to continue.
            </p>
            <button
              onClick={() => (window.location.href = "/login")}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-lg shadow"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-10">
      <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 text-[#141414] border border-[rgba(20,20,20,0.06)]">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-[#141414]">
              Create a New Bot
            </h1>
            <p className="text-sm text-[#4b5563] mt-1">
              Configure your bot's personality, upload knowledge documents, and
              preview the interface before creating it.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form className="lg:col-span-2" onSubmit={onSubmit}>
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Bot Name
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  className="mt-2 block w-full bg-white border rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgba(20,20,20,0.12)] border-[rgba(20,20,20,0.06)] text-[#141414]"
                  placeholder="e.g. Support Genie"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Basic System Instructions
                </span>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="mt-2 block w-full bg-white border rounded-lg px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgba(20,20,20,0.12)] border-[rgba(20,20,20,0.06)] text-[#141414]"
                  placeholder="Give the bot a short description of its role and tone."
                  rows={5}
                />
              </label>

              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => generateInstructions()}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded border bg-white text-[#141414] hover:bg-[#f3f3f3]"
                >
                  {isGenerating ? "Generating..." : "Write with AI"}
                </button>
                <span className="text-xs text-slate-400">
                  Use AI to write a system instruction
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <label className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-700">
                    Bot Interface Color
                  </span>
                  <input
                    aria-label="Choose bot color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="ml-3 w-12 h-10 p-0 border rounded-md"
                  />
                  <span
                    className="ml-2 inline-block w-8 h-8 rounded-full border"
                    style={{ backgroundColor: color }}
                    title={`Selected color ${color}`}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Upload Document
                  </span>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      id="file-upload"
                      type="file"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={onFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-lg cursor-pointer text-sm hover:bg-[#f7f7f7] border-[rgba(20,20,20,0.06)]"
                      style={{ color: "#141414" }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-slate-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M8.707 7.293a1 1 0 00-1.414 1.414L8.586 10H5a1 1 0 000 2h3.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3z" />
                      </svg>
                      <span>Choose file</span>
                    </label>
                    <div className="text-sm text-slate-600">
                      {fileName ?? (
                        <span className="italic">No file selected</span>
                      )}
                    </div>
                    {fileError && (
                      <div className="text-sm text-red-600 mt-1">
                        {fileError}
                      </div>
                    )}
                    {fileName ? (
                      <button
                        type="button"
                        onClick={clearFile}
                        className="ml-auto text-sm text-red-500"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </label>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-[#141414] hover:bg-[#1f1f1f] disabled:bg-[#777777] text-white font-semibold px-5 py-2 rounded-lg shadow"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    "Create Bot"
                  )}
                </button>
                {success && (
                  <span className="ml-4 inline-block bg-emerald-100 text-emerald-800 px-3 py-1 rounded">
                    Bot created successfully!
                  </span>
                )}
                {error && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </form>

          <aside className="rounded-lg border p-4 bg-white border-[rgba(20,20,20,0.06)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold">Live preview</h3>
                <p className="text-xs text-slate-500">
                  See how your bot will look in the chat interface
                </p>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden shadow-sm">
              <div
                className="px-4 py-3 flex items-center gap-3"
                style={{ backgroundColor: color }}
              >
                <div className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center font-bold text-white">
                  {(name && name[0]) || "B"}
                </div>
                <div className="text-white font-semibold truncate">
                  {name || "Your Bot"}
                </div>
              </div>
              <div className="p-4 bg-white">
                <div className="space-y-3">
                  <div className="max-w-[80%] bg-slate-100 text-slate-800 rounded-lg px-3 py-2">
                    Hi — how can I help you today?
                  </div>
                  <div className="ml-auto max-w-[75%] bg-indigo-600 text-white rounded-lg px-3 py-2">
                    I need help with my order.
                  </div>
                  <div className="max-w-[70%] bg-slate-100 text-slate-800 rounded-lg px-3 py-2">
                    Sure — can you share your order id?
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* AI Instructions Panel */}
        {showAIPanel && (
          <div className="mt-3 p-3 border rounded bg-white shadow">
            <div className="mb-2 text-sm text-slate-600">AI suggestion</div>
            <div className="mb-3 whitespace-pre-wrap text-sm text-[#141414]">
              {aiPreview}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setInstructions(aiPreview || "");
                  setShowAIPanel(false);
                }}
                className="px-3 py-1 bg-[#141414] text-white rounded"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => generateInstructions()} // regenerate
                className="px-3 py-1 border rounded"
              >
                Regenerate
              </button>
              <button
                type="button"
                onClick={() => setShowAIPanel(false)}
                className="px-3 py-1 text-slate-600"
              >
                Cancel
              </button>
            </div>
            {aiError && (
              <div className="mt-2 text-xs text-red-600">{aiError}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
