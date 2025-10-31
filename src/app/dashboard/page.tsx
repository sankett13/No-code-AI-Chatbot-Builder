"use client"; 

import BotAnalytics from "@/components/dashboard/BotAnalytics"; 


export default function DashboardPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold mb-6">Bot Analytics</h1>

      <BotAnalytics />
    </>
  );
}