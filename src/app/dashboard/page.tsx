"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      setLoading(false);

      if (error) {
        console.error("Auth error", error);
        router.push("/login");
        return;
      }

      const session = data?.session;
      if (!session) {
        router.push("/login");
        return;
      }

      // Try to read user's profile first name from `profiles` table
      try {
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profileErr) {
          console.warn("Failed to fetch profile", profileErr);
          // fallback to email if profile lookup fails
          setFirstName(session.user.email ?? null);
        } else {
          const name =
            (profile as any)?.first_name ?? session.user.email ?? null;
          setFirstName(name);
        }
      } catch (err) {
        console.warn("Profile lookup exception", err);
        setFirstName(session.user.email ?? null);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">{firstName}</span>
            <button
              onClick={handleSignOut}
              className="px-3 py-1 border rounded text-sm"
            >
              Sign out
            </button>
          </div>
        </header>

        <section className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-medium mb-2">Welcome</h2>
          <p className="text-sm text-gray-700">
            This is your bot management dashboard placeholder. From here you
            will be able to create bots, ingest documents, and configure your
            embed snippet.
          </p>

          <div className="mt-6 space-x-2">
            <a
              href="/dashboard/bots/new"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
            >
              Create bot
            </a>
            <a href="/" className="inline-block border px-4 py-2 rounded">
              Back to home
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
