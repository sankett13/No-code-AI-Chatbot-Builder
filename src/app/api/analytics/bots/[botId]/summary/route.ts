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

export async function GET(
  req: Request,
  context: { params: Promise<{ botId: string }> }
) {
  try {
    const { botId } = await context.params;
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30d"; // 7d, 30d, 90d

    // Parse range
    const daysMap: Record<string, number> = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
    };
    const days = daysMap[range] || 30;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily stats
    const { data: dailyStats, error: dailyError } = await supabaseAdmin
      .from("bot_daily_stats")
      .select("*")
      .eq("bot_id", botId)
      .gte("day", startDate.toISOString().split("T")[0])
      .lte("day", endDate.toISOString().split("T")[0])
      .order("day", { ascending: true });

    if (dailyError) {
      console.error("Error fetching daily stats:", dailyError);
      return NextResponse.json(
        { error: "Failed to fetch stats" },
        { status: 500 }
      );
    }

    // Calculate summary metrics
    const totalSessions =
      dailyStats?.reduce((sum, day) => sum + (day.sessions || 0), 0) || 0;
    const totalMessages =
      dailyStats?.reduce((sum, day) => sum + (day.messages || 0), 0) || 0;
    const totalFallbacks =
      dailyStats?.reduce((sum, day) => sum + (day.fallback_count || 0), 0) || 0;
    const totalSucceeded =
      dailyStats?.reduce((sum, day) => sum + (day.succeeded_count || 0), 0) ||
      0;

    const avgMessagesPerSession =
      totalSessions > 0
        ? parseFloat((totalMessages / totalSessions).toFixed(2))
        : 0;

    const avgResponseTimes = dailyStats
      ?.map((d) => d.avg_response_time_ms)
      .filter((t) => t !== null && t !== undefined);
    const avgResponseTime =
      avgResponseTimes && avgResponseTimes.length > 0
        ? parseFloat(
            (
              avgResponseTimes.reduce((sum, t) => sum + Number(t), 0) /
              avgResponseTimes.length
            ).toFixed(2)
          )
        : 0;

    const overallFallbackRate =
      totalMessages > 0
        ? parseFloat(((totalFallbacks / totalMessages) * 100).toFixed(2))
        : 0;

    const successRate =
      totalMessages > 0
        ? parseFloat(((totalSucceeded / totalMessages) * 100).toFixed(2))
        : 0;

    // Get top queries
    const { data: topQueries } = await supabaseAdmin
      .from("bot_queries_stats")
      .select("query_sample, request_count, fallback_count, fallback_rate")
      .eq("bot_id", botId)
      .gte("day", startDate.toISOString().split("T")[0])
      .order("request_count", { ascending: false })
      .limit(20);

    // Aggregate top queries (sum across days)
    const queryMap = new Map<string, any>();
    topQueries?.forEach((q) => {
      const existing = queryMap.get(q.query_sample);
      if (existing) {
        existing.request_count += q.request_count;
        existing.fallback_count += q.fallback_count;
        existing.fallback_rate = parseFloat(
          ((existing.fallback_count / existing.request_count) * 100).toFixed(2)
        );
      } else {
        queryMap.set(q.query_sample, { ...q });
      }
    });

    const aggregatedQueries = Array.from(queryMap.values())
      .sort((a, b) => b.request_count - a.request_count)
      .slice(0, 20);

    // Get country distribution
    const { data: countryStats } = await supabaseAdmin
      .from("bot_country_stats")
      .select("country, sessions, messages")
      .eq("bot_id", botId)
      .gte("day", startDate.toISOString().split("T")[0])
      .order("sessions", { ascending: false })
      .limit(10);

    // Aggregate country stats
    const countryMap = new Map<string, any>();
    countryStats?.forEach((c) => {
      const existing = countryMap.get(c.country);
      if (existing) {
        existing.sessions += c.sessions;
        existing.messages += c.messages;
      } else {
        countryMap.set(c.country, { ...c });
      }
    });

    const aggregatedCountries = Array.from(countryMap.values())
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 10);

    // Return summary
    return NextResponse.json({
      summary: {
        total_sessions: totalSessions,
        total_messages: totalMessages,
        total_succeeded: totalSucceeded,
        total_fallbacks: totalFallbacks,
        avg_messages_per_session: avgMessagesPerSession,
        avg_response_time_ms: avgResponseTime,
        fallback_rate: overallFallbackRate,
        success_rate: successRate,
      },
      daily_stats: dailyStats,
      top_queries: aggregatedQueries,
      countries: aggregatedCountries,
      range,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Summary endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
