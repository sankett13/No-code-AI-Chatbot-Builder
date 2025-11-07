"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    // Parse fragment (hash) e.g. #access_token=...&refresh_token=...&provider_token=...
    const rawHash = window.location.hash || "";
    const hash = rawHash.startsWith("#") ? rawHash.substring(1) : rawHash;
    const params = new URLSearchParams(hash);

    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (access_token && refresh_token) {
      // Set session in the Supabase client
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(() => {
          // Remove tokens from the address bar and navigate to dashboard
          try {
            history.replaceState({}, "", "/dashboard");
          } catch (e) {
            // ignore
          }
          router.replace("/dashboard");
        })
        .catch((err) => {
          console.error("Failed to set Supabase session from callback:", err);
          router.replace("/login?error=session_failed");
        });
    } else {
      // No tokens found in hash — redirect to login
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Completing sign-in…</p>
    </div>
  );
}
