"use client";
import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validate password match before calling Supabase
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      // Quick check: if a profile already exists with this email, show error
      try {
        const { data: existingProfile, error: profileErr } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (profileErr) {
          console.warn("Error checking existing profile", profileErr);
        }

        if (existingProfile) {
          setMessage(
            "An account with this email already exists. Please log in."
          );
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn("Profile lookup failed", e);
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (error) {
        // Friendly handling for already-registered emails
        const msg = error.message?.toLowerCase?.() ?? "";
        if (
          msg.includes("already") ||
          msg.includes("registered") ||
          msg.includes("duplicate")
        ) {
          setMessage(
            "An account with this email already exists. Please log in or reset your password."
          );
        } else {
          setMessage(error.message);
        }
        setLoading(false);
        return;
      }

      const user = data.user ?? data?.session?.user ?? null;

      // Insert profile row into `profiles` table with the user's id
      if (user) {
        const profileInsert = await supabase.from("profiles").insert({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          email: normalizedEmail,
        });

        if (profileInsert.error) {
          // Profile insertion failed; log and show message but don't block signup
          console.error("Failed to insert profile", profileInsert.error);
          setMessage("Account created, but failed to save profile.");
        } else {
          // Success: either session exists or user must confirm email
          if (data?.session) {
            router.push("/dashboard");
            return;
          }
          setMessage(
            "Check your email for a confirmation link to complete sign up."
          );
        }
      } else {
        setMessage(
          "Sign up succeeded but no user returned. Check your Supabase settings."
        );
      }
    } catch (err: any) {
      console.error(err);
      setMessage(err?.message ?? "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-semibold mb-4">Create an account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm">First name</span>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="mt-1 block w-full border rounded px-3 py-2"
              />
            </label>

            <label className="block">
              <span className="text-sm">Last name</span>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="mt-1 block w-full border rounded px-3 py-2"
              />
            </label>
          </div>

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
              minLength={6}
              className="mt-1 block w-full border rounded px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="text-sm">Confirm password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}

        <p className="mt-4 text-sm">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
