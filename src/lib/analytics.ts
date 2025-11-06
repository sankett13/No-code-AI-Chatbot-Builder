// Analytics utility for tracking bot events
// This runs client-side in the widget

// Generate or retrieve session ID from sessionStorage
export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";

  const storageKey = "bot_session_id";
  let sessionId = sessionStorage.getItem(storageKey);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(storageKey, sessionId);
  }

  return sessionId;
}

interface AnalyticsEvent {
  event_type:
    | "session_start"
    | "session_end"
    | "user_message"
    | "bot_message"
    | "fallback"
    | "rating"
    | "error";
  bot_id: string;
  session_id: string;
  message_id?: string;
  user_id?: string;
  message_text?: string;
  intent?: string;
  response_time_ms?: number;
  channel?: string;
  metadata?: Record<string, any>;
}

// Send analytics event to the backend
export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  try {
    // Don't block the UI - fire and forget
    fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      keepalive: true, // Ensure it sends even if page is closing
    }).catch((error) => {
      console.warn("Analytics tracking failed:", error);
    });
  } catch (error) {
    console.warn("Failed to track analytics event:", error);
  }
}

// Track session start
export function trackSessionStart(botId: string): void {
  const sessionId = getOrCreateSessionId();
  trackEvent({
    event_type: "session_start",
    bot_id: botId,
    session_id: sessionId,
    channel: "embed",
  });
}

// Track session end (e.g., when widget is closed or page unloads)
export function trackSessionEnd(botId: string): void {
  const sessionId = getOrCreateSessionId();
  trackEvent({
    event_type: "session_end",
    bot_id: botId,
    session_id: sessionId,
    channel: "embed",
  });
}

// Track user message
export function trackUserMessage(botId: string, message: string): string {
  const sessionId = getOrCreateSessionId();
  const messageId = crypto.randomUUID();

  trackEvent({
    event_type: "user_message",
    bot_id: botId,
    session_id: sessionId,
    message_id: messageId,
    message_text: message,
    channel: "embed",
  });

  return messageId;
}

// Track bot response
export function trackBotMessage(
  botId: string,
  message: string,
  responseTimeMs: number,
  isFallback: boolean = false
): void {
  const sessionId = getOrCreateSessionId();
  const messageId = crypto.randomUUID();

  trackEvent({
    event_type: "bot_message",
    bot_id: botId,
    session_id: sessionId,
    message_id: messageId,
    message_text: message,
    response_time_ms: responseTimeMs,
    channel: "embed",
    metadata: { is_fallback: isFallback },
  });
}

// Track fallback (when bot doesn't know the answer)
export function trackFallback(botId: string, userMessage: string): void {
  const sessionId = getOrCreateSessionId();

  trackEvent({
    event_type: "fallback",
    bot_id: botId,
    session_id: sessionId,
    message_text: userMessage,
    channel: "embed",
  });
}

// Track error
export function trackError(botId: string, errorMessage: string): void {
  const sessionId = getOrCreateSessionId();

  trackEvent({
    event_type: "error",
    bot_id: botId,
    session_id: sessionId,
    message_text: errorMessage,
    channel: "embed",
  });
}
