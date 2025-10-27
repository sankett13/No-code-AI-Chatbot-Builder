"use client";
import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // If sign-in successful, redirect to dashboard
    if (data?.session) {
      router.push("/dashboard");
    } else {
      // If no session returned, still redirect and the dashboard will check session
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
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

          <label className="block">
            <span className="text-sm">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full border rounded px-3 py-2"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {errorMsg && <p className="mt-4 text-sm text-red-600">{errorMsg}</p>}
        <p className="mt-4 text-sm">
          <a href="/forgot-password" className="text-blue-600 mr-4">
            Forgot your password?
          </a>
          Don't have an account yet?{" "}
          <a href="/register" className="text-blue-600">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
