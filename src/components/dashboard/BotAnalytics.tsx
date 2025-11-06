"use client";

import { useState, useEffect } from "react";

interface DailyStat {
  day: string;
  sessions: number;
  messages: number;
  succeeded_count: number;
  fallback_count: number;
  fallback_rate: number;
  avg_response_time_ms: number;
  avg_messages_per_session: number;
}

interface TopQuery {
  query_sample: string;
  request_count: number;
  fallback_count: number;
  fallback_rate: number;
}

interface CountryStat {
  country: string;
  sessions: number;
  messages: number;
}

interface AnalyticsData {
  summary: {
    total_sessions: number;
    total_messages: number;
    total_succeeded: number;
    total_fallbacks: number;
    avg_messages_per_session: number;
    avg_response_time_ms: number;
    fallback_rate: number;
    success_rate: number;
  };
  daily_stats: DailyStat[];
  top_queries: TopQuery[];
  countries: CountryStat[];
  range: string;
}

interface BotAnalyticsProps {
  botId: string;
}

export default function BotAnalytics({ botId }: BotAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [botId, range]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/analytics/bots/${botId}/summary?range=${range}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error || "No data available"}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Bot Analytics</h2>
        <div className="flex gap-2">
          {["7d", "30d", "90d"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                range === r
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Sessions"
          value={data.summary.total_sessions.toLocaleString()}
          icon="📊"
          color="blue"
        />
        <SummaryCard
          title="Total Messages"
          value={data.summary.total_messages.toLocaleString()}
          icon="💬"
          color="green"
        />
        <SummaryCard
          title="Success Rate"
          value={`${data.summary.success_rate}%`}
          icon="✅"
          color="emerald"
        />
        <SummaryCard
          title="Fallback Rate"
          value={`${data.summary.fallback_rate}%`}
          icon="❌"
          color="red"
        />
        <SummaryCard
          title="Avg Messages/Session"
          value={data.summary.avg_messages_per_session.toFixed(1)}
          icon="📈"
          color="purple"
        />
        <SummaryCard
          title="Avg Response Time"
          value={`${Math.round(data.summary.avg_response_time_ms)}ms`}
          icon="⚡"
          color="yellow"
        />
        <SummaryCard
          title="Successful Answers"
          value={data.summary.total_succeeded.toLocaleString()}
          icon="👍"
          color="teal"
        />
        <SummaryCard
          title="Unanswered Queries"
          value={data.summary.total_fallbacks.toLocaleString()}
          icon="❓"
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Requests Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Daily Requests</h3>
          <DailyRequestsChart data={data.daily_stats} />
        </div>

        {/* Success vs Fallback Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Success vs Fallback</h3>
          <SuccessFallbackChart data={data.daily_stats} />
        </div>
      </div>

      {/* Top Queries Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Top Queries</h3>
        <TopQueriesTable queries={data.top_queries} />
      </div>

      {/* Country Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          Origin Distribution (by Country)
        </h3>
        <CountryDistribution countries={data.countries} />
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    emerald: "bg-emerald-50 border-emerald-200",
    red: "bg-red-50 border-red-200",
    purple: "bg-purple-50 border-purple-200",
    yellow: "bg-yellow-50 border-yellow-200",
    teal: "bg-teal-50 border-teal-200",
    orange: "bg-orange-50 border-orange-200",
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

function DailyRequestsChart({ data }: { data: DailyStat[] }) {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-center py-8">No data available</p>;
  }

  const maxMessages = Math.max(...data.map((d) => d.messages));
  const chartHeight = 200;

  return (
    <div className="relative">
      <svg width="100%" height={chartHeight} className="overflow-visible">
        {data.map((stat, index) => {
          const barHeight = (stat.messages / maxMessages) * (chartHeight - 40);
          const x = (index / data.length) * 100;
          const width = 100 / data.length - 1;

          return (
            <g key={stat.day}>
              <rect
                x={`${x}%`}
                y={chartHeight - barHeight - 20}
                width={`${width}%`}
                height={barHeight}
                className="fill-blue-500 hover:fill-blue-600 transition"
              />
              <text
                x={`${x + width / 2}%`}
                y={chartHeight - 5}
                className="text-xs fill-gray-600"
                textAnchor="middle"
              >
                {new Date(stat.day).getDate()}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="text-xs text-gray-500 mt-2 text-center">
        {data.length > 0 && `${data[0].day} to ${data[data.length - 1].day}`}
      </div>
    </div>
  );
}

function SuccessFallbackChart({ data }: { data: DailyStat[] }) {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-center py-8">No data available</p>;
  }

  const maxValue = Math.max(
    ...data.map((d) => d.succeeded_count + d.fallback_count)
  );
  const chartHeight = 200;

  return (
    <div className="relative">
      <svg width="100%" height={chartHeight} className="overflow-visible">
        {data.map((stat, index) => {
          const totalHeight =
            ((stat.succeeded_count + stat.fallback_count) / maxValue) *
            (chartHeight - 40);
          const successHeight =
            (stat.succeeded_count /
              (stat.succeeded_count + stat.fallback_count || 1)) *
            totalHeight;
          const fallbackHeight = totalHeight - successHeight;
          const x = (index / data.length) * 100;
          const width = 100 / data.length - 1;

          return (
            <g key={stat.day}>
              {/* Success bar (bottom) */}
              <rect
                x={`${x}%`}
                y={chartHeight - totalHeight - 20}
                width={`${width}%`}
                height={successHeight}
                className="fill-green-500"
              />
              {/* Fallback bar (top) */}
              <rect
                x={`${x}%`}
                y={chartHeight - fallbackHeight - 20}
                width={`${width}%`}
                height={fallbackHeight}
                className="fill-red-500"
              />
              <text
                x={`${x + width / 2}%`}
                y={chartHeight - 5}
                className="text-xs fill-gray-600"
                textAnchor="middle"
              >
                {new Date(stat.day).getDate()}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center justify-center gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Succeeded</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Fallback</span>
        </div>
      </div>
    </div>
  );
}

function TopQueriesTable({ queries }: { queries: TopQuery[] }) {
  if (!queries || queries.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4">No queries recorded yet</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Query
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Count
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fallback Count
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fallback Rate
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {queries.slice(0, 10).map((query, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                {query.query_sample || "N/A"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {query.request_count}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {query.fallback_count}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    query.fallback_rate > 50
                      ? "bg-red-100 text-red-800"
                      : query.fallback_rate > 25
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {query.fallback_rate.toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CountryDistribution({ countries }: { countries: CountryStat[] }) {
  if (!countries || countries.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4">
        No location data available
      </p>
    );
  }

  const total = countries.reduce((sum, c) => sum + c.sessions, 0);

  return (
    <div className="space-y-3">
      {countries.map((country, index) => {
        const percentage = total > 0 ? (country.sessions / total) * 100 : 0;

        return (
          <div key={index} className="flex items-center gap-4">
            <div className="w-24 text-sm font-medium text-gray-700">
              {country.country || "Unknown"}
            </div>
            <div className="flex-1">
              <div className="bg-gray-200 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-blue-500 h-full flex items-center justify-end pr-2"
                  style={{ width: `${percentage}%` }}
                >
                  {percentage > 10 && (
                    <span className="text-xs font-medium text-white">
                      {percentage.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="w-20 text-sm text-gray-600 text-right">
              {country.sessions} sessions
            </div>
          </div>
        );
      })}
    </div>
  );
}
