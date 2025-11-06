"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    }
  }, [user, loading]);

  // Remove the loading state entirely to avoid flicker
  if (!user) {
    return null; // Render nothing until authentication is resolved
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Dashboard content sits below the global Navbar (root layout provides top padding) */}

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 bg-black text-white">
          <Sidebar userEmail={user?.email || "unknown@example.com"} />
        </div>
        {/* Main Content Area with Smooth Transition */}
        <main className="flex-1 overflow-y-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute w-full h-full"
            >
              <div className="p-6 lg:p-10">{children}</div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      {/* Footer is rendered globally in the root layout */}
    </div>
  );
}
