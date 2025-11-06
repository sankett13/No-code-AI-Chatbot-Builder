"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import BotAnalytics from "@/components/dashboard/BotAnalytics";

type Bot = {
  id: string;
  name: string;
};

export default function DashboardPage() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBots = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Error fetching user:", userError);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("bots")
        .select("id, name")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching bots:", error);
      } else {
        setBots(data as Bot[]);
        // Auto-select first bot if available
        if (data && data.length > 0) {
          setSelectedBotId(data[0].id);
        }
      }
      setLoading(false);
    };

    fetchBots();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (bots.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-extrabold mb-4">Dashboard</h1>
        <p className="text-gray-600 mb-6">
          No bots found. Create a bot first to see analytics.
        </p>
        <a
          href="/dashboard/create-bot"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Your First Bot
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold mb-4">
          Bot Analytics Dashboard
        </h1>

        {/* Bot Selector */}
        {bots.length > 1 && (
          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm font-medium text-gray-700">
              Select Bot:
            </label>
            <select
              value={selectedBotId || ""}
              onChange={(e) => setSelectedBotId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {bots.map((bot) => (
                <option key={bot.id} value={bot.id}>
                  {bot.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedBotId && <BotAnalytics botId={selectedBotId} />}
    </div>
  );
}
