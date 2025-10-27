"use client";
import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setErrorMsg(null);

    try {
      // For supabase-js v2: resetPasswordForEmail(email, { redirectTo })
      // Provide a redirect so users return to your app after following the email link.
      const redirectTo = `${window.location.origin}/reset-password`;
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      setMessage(
        "If an account with that email exists, a password reset link has been sent. Check your inbox."
      );
    } catch (err: any) {
      setErrorMsg(err?.message ?? "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-semibold mb-4">Reset your password</h1>
        <p className="text-sm mb-4">
          Enter the email address for your account and we'll send a link to
          reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full border rounded px-3 py-2"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-green-700">{message}</p>}
        {errorMsg && <p className="mt-4 text-sm text-red-600">{errorMsg}</p>}

        <p className="mt-4 text-sm">
          Remembered your password?{" "}
          <a href="/login" className="text-blue-600">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
