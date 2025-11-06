import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Create Supabase admin client for service role operations
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

// Simple in-memory rate limiter
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 200; // requests per minute
const RATE_WINDOW = 60000; // 1 minute in ms

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

// Hash IP for privacy
function hashIP(ip: string): string {
  const salt = process.env.IP_HASH_SALT || "default-salt-change-in-production";
  return crypto
    .createHash("sha256")
    .update(salt + ip)
    .digest("hex");
}

// Simple geo lookup (you can replace with maxmind or ip-api.com)
async function getCountryFromIP(ip: string): Promise<string | null> {
  try {
    // Skip for local IPs
    if (
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.") ||
      ip.startsWith("172.")
    ) {
      return "Local";
    }

    // Use free ip-api.com service (limit: 45 req/min)
    // For production, consider using MaxMind GeoLite2 database locally
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=countryCode`,
      {
        signal: AbortSignal.timeout(2000),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.countryCode || null;
    }
  } catch (error) {
    console.warn("Geo lookup failed:", error);
  }
  return null;
}

// Redact PII from message text
function redactPII(text: string): string {
  if (!text) return text;

  // Remove email addresses
  let redacted = text.replace(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    "[EMAIL]"
  );

  // Remove phone numbers (basic pattern)
  redacted = redacted.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[PHONE]");

  // Remove credit card numbers
  redacted = redacted.replace(
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    "[CARD]"
  );

  // Truncate to max length
  return redacted.substring(0, 2000);
}

export async function POST(req: Request) {
  try {
    // Get client IP
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

    // Rate limiting per IP
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Parse body
    const body = await req.json();
    const {
      event_type,
      bot_id,
      session_id,
      message_id,
      user_id,
      message_text,
      intent,
      response_time_ms,
      channel = "embed",
      metadata,
    } = body;

    // Validate required fields
    if (!event_type || !bot_id || !session_id) {
      return NextResponse.json(
        { error: "Missing required fields: event_type, bot_id, session_id" },
        { status: 400 }
      );
    }

    // Validate event_type
    const validEventTypes = [
      "session_start",
      "session_end",
      "user_message",
      "bot_message",
      "fallback",
      "rating",
      "error",
    ];
    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json(
        { error: "Invalid event_type" },
        { status: 400 }
      );
    }

    // Hash IP and get country (async but don't block on it)
    const ip_hash = hashIP(ip);
    let country = null;

    // Only lookup country for session_start to reduce API calls
    if (event_type === "session_start") {
      country = await getCountryFromIP(ip);
    }

    // Redact PII from message text
    const sanitizedMessageText = message_text ? redactPII(message_text) : null;

    // Insert event into database
    const { error: insertError } = await supabaseAdmin
      .from("bot_analytics_events")
      .insert({
        bot_id,
        session_id,
        event_type,
        message_id: message_id || null,
        user_id: user_id || null,
        message_text: sanitizedMessageText,
        intent: intent || null,
        response_time_ms: response_time_ms || null,
        channel,
        ip_hash,
        country,
        metadata: metadata || null,
      });

    if (insertError) {
      console.error("Database insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to store event" },
        { status: 500 }
      );
    }

    // Update or create session record
    if (event_type === "session_start") {
      await supabaseAdmin.from("bot_sessions").upsert(
        {
          session_id,
          bot_id,
          started_at: new Date().toISOString(),
          user_id: user_id || null,
          country,
          metadata: metadata || null,
        },
        { onConflict: "session_id" }
      );
    } else if (event_type === "session_end") {
      // Update session end time
      await supabaseAdmin
        .from("bot_sessions")
        .update({ ended_at: new Date().toISOString() })
        .eq("session_id", session_id);
    }

    // Increment message count for session if it's a message event
    if (event_type === "user_message" || event_type === "bot_message") {
      const { data: session } = await supabaseAdmin
        .from("bot_sessions")
        .select("messages_count")
        .eq("session_id", session_id)
        .single();

      if (session) {
        await supabaseAdmin
          .from("bot_sessions")
          .update({ messages_count: (session.messages_count || 0) + 1 })
          .eq("session_id", session_id);
      }
    }

    // Return success
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Analytics event error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "analytics-event-ingestion",
  });
}
