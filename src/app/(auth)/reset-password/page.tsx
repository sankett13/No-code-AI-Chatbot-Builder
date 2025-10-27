"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Parse the URL and complete the auth flow to obtain a session.
    const finish = async () => {
      setLoading(true);
      try {
        // Prefer the built-in helper when available
        if (typeof (supabase.auth as any).getSessionFromUrl === "function") {
          const { data, error } = await (
            supabase.auth as any
          ).getSessionFromUrl({
            storeSession: true,
          });
          if (error) {
            setMessage(error.message || "Failed to process the reset link.");
            setLoading(false);
            return;
          }
          if (data?.session) {
            setSessionActive(true);
          } else {
            setMessage("No session was returned from the reset link.");
          }
        } else {
          // Fallback: manually parse the URL hash for tokens and set the session
          const hash = window.location.hash.replace(/^#/, "");
          const params = new URLSearchParams(hash);
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");
          const type = params.get("type");

          if (type === "recovery" && access_token) {
            // setSession accepts an object with access_token and refresh_token
            const sessionObj: any = { access_token };
            if (refresh_token) sessionObj.refresh_token = refresh_token;
            const { error } = await supabase.auth.setSession(sessionObj);
            if (error) {
              setMessage(error.message || "Failed to set session from URL.");
            } else {
              // clear the hash to tidy up the URL
              window.location.hash = "";
              setSessionActive(true);
            }
          } else {
            setMessage("No valid recovery information found in the link.");
          }
        }
      } catch (err: any) {
        setMessage(err?.message ?? "Failed to process the reset link.");
      } finally {
        setLoading(false);
      }
    };
    finish();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage(
        "Password updated — you can now sign in with your new password."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-semibold mb-2">Set a new password</h1>
        <p className="text-sm text-gray-600 mb-6">
          Paste the link you received in your email. If the link is valid you
          can choose a new password below.
        </p>

        {loading ? (
          <div className="py-8 text-center">Processing link…</div>
        ) : !sessionActive ? (
          <div className="space-y-4">
            <p className="text-sm text-red-600">
              {message ?? "Invalid or expired link."}
            </p>
            <div>
              <a href="/forgot-password" className="text-blue-600">
                Request a new reset email
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm">New password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 block w-full border rounded px-3 py-2"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded"
            >
              {loading ? "Updating..." : "Set new password"}
            </button>

            {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}

            <p className="mt-4 text-sm">
              Remembered your password?{" "}
              <a href="/login" className="text-blue-600">
                Sign in
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
