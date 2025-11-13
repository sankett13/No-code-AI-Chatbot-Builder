"use client";

import { useState, useEffect, memo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  return (
    <header className="bg-white shadow-md py-4 px-6 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        <a href="/" className="flex items-center gap-4">
          <span className="text-xl font-semibold text-gray-800">
            AI Chatbot Builder
          </span>
        </a>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <a
            href="/blog"
            className="relative text-gray-600 hover:text-gray-800 after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:bg-[#141414] after:w-0 hover:after:w-full after:transition-all after:duration-300 focus:outline-none focus-visible:after:w-full"
          >
            Blogs
          </a>

          <a
            href="/pricing"
            className="relative text-gray-600 hover:text-gray-800 after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:bg-[#141414] after:w-0 hover:after:w-full after:transition-all after:duration-300 focus:outline-none focus-visible:after:w-full"
          >
            Pricing
          </a>

          {isLoggedIn && (
            <a
              href="/dashboard"
              className="relative text-gray-600 hover:text-gray-800 after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:bg-[#141414] after:w-0 hover:after:w-full after:transition-all after:duration-300 focus:outline-none focus-visible:after:w-full"
            >
              Dashboard
            </a>
          )}

          <a
            href="/contact"
            className="relative text-gray-600 hover:text-gray-800 after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:bg-[#141414] after:w-0 hover:after:w-full after:transition-all after:duration-300 focus:outline-none focus-visible:after:w-full"
          >
            Contact
          </a>

          {!loading && (
            <>
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="ml-2 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 transition"
                >
                  Log Out
                </button>
              ) : (
                <>
                  <a
                    href="/login"
                    className="relative text-gray-600 hover:text-gray-800 after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:bg-[#141414] after:w-0 hover:after:w-full after:transition-all after:duration-300 focus:outline-none focus-visible:after:w-full"
                  >
                    Log In
                  </a>
                  <a
                    href="/register"
                    className="ml-2 inline-flex items-center px-4 py-2 bg-black text-white rounded-md shadow-sm hover:opacity-95 transition"
                  >
                    Sign Up
                  </a>
                </>
              )}
            </>
          )}
        </nav>

        {/* Mobile menu using details/summary (no state import needed) */}
        <div className="md:hidden">
          <details className="relative">
            <summary className="flex items-center gap-2 list-none cursor-pointer">
              <svg
                className="h-6 w-6 text-gray-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <span className="sr-only">Open menu</span>
            </summary>
            <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-sm rounded-md shadow-lg p-3 flex flex-col gap-2">
              {!loading && (
                <>
                  {!isLoggedIn && (
                    <a
                      href="/register"
                      className="px-2 py-2 rounded hover:bg-gray-100"
                    >
                      Get Started
                    </a>
                  )}

                  {isLoggedIn && (
                    <a
                      href="/dashboard"
                      className="px-2 py-2 rounded hover:bg-gray-100"
                    >
                      Dashboard
                    </a>
                  )}

                  <a
                    href="/blogs"
                    className="px-2 py-2 rounded hover:bg-gray-100"
                  >
                    Blogs
                  </a>
                  <a
                    href="/contact"
                    className="px-2 py-2 rounded hover:bg-gray-100"
                  >
                    Contact
                  </a>

                  {isLoggedIn ? (
                    <button
                      onClick={handleLogout}
                      className="px-2 py-2 rounded hover:bg-red-50 text-red-600 text-left"
                    >
                      Log Out
                    </button>
                  ) : (
                    <a
                      href="/login"
                      className="px-2 py-2 rounded hover:bg-gray-100"
                    >
                      Sign In
                    </a>
                  )}
                </>
              )}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

export default /*#__PURE__*/ memo(Navbar);
