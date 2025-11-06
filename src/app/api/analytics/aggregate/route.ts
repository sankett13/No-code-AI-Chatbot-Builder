import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(req: Request) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "change-me-in-production";

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bot_id, days = 7 } = body;

    // Get all bots if no specific bot_id provided
    let botIds: string[] = [];

    if (bot_id) {
      botIds = [bot_id];
    } else {
      // Get all active bots from events in last 7 days
      const { data: activeBots } = await supabaseAdmin
        .from("bot_analytics_events")
        .select("bot_id")
        .gte(
          "created_at",
          new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
        )
        .order("bot_id");

      if (activeBots) {
        botIds = [...new Set(activeBots.map((b) => b.bot_id))];
      }
    }

    const results = [];

    // Process each bot
    for (const botId of botIds) {
      // Compute stats for last N days
      for (let i = 0; i < days; i++) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - i);
        const dayStr = targetDate.toISOString().split("T")[0];

        try {
          // Call the SQL function to compute daily stats
          const { error } = await supabaseAdmin.rpc("compute_bot_daily_stats", {
            target_bot_id: botId,
            target_day: dayStr,
          });

          if (error) {
            console.error(
              `Error computing stats for bot ${botId} on ${dayStr}:`,
              error
            );
          } else {
            results.push({ bot_id: botId, day: dayStr, status: "success" });
          }
        } catch (error) {
          console.error(
            `Exception computing stats for bot ${botId} on ${dayStr}:`,
            error
          );
          results.push({
            bot_id: botId,
            day: dayStr,
            status: "error",
            error: String(error),
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: botIds.length,
      results,
      message: `Computed stats for ${botIds.length} bot(s) over ${days} day(s)`,
    });
  } catch (error) {
    console.error("Aggregation job error:", error);
    return NextResponse.json(
      { error: "Aggregation job failed", details: String(error) },
      { status: 500 }
    );
  }
}

// Manual trigger endpoint for testing
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const botId = searchParams.get("bot_id");
  const days = parseInt(searchParams.get("days") || "7");

  // For GET, require a simple auth token for manual testing
  const token = searchParams.get("token");
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Redirect to POST
  return POST(
    new Request(req.url, {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      body: JSON.stringify({ bot_id: botId, days }),
    })
  );
}
