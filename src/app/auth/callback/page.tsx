"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Completing sign-in...");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Parse token from hash (preferred) or query (fallback)
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.substring(1)
      : window.location.hash;
    const hashParams = new URLSearchParams(hash);

    const queryParams = new URLSearchParams(window.location.search);

    const access_token =
      hashParams.get("access_token") || queryParams.get("access_token");
    const refresh_token =
      hashParams.get("refresh_token") || queryParams.get("refresh_token");

    async function finish() {
      try {
        if (access_token && refresh_token) {
          // Set the session client-side so supabase-js knows the user
          await supabase.auth.setSession({ access_token, refresh_token });

          // Remove tokens from URL and navigate to dashboard
          const target = "/dashboard";
          history.replaceState({}, "", target);
          router.replace(target);
          return;
        }

        // If no tokens, just redirect to login
        router.replace("/login");
      } catch (err) {
        console.error("Auth callback failed:", err);
        setMessage("Failed to complete sign-in. Redirecting to login...");
        setTimeout(() => router.replace("/login"), 2500);
      }
    }

    finish();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-700">{message}</p>
      </div>
    </div>
  );
}
