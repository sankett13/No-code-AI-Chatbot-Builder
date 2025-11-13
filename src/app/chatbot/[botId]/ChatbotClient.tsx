"use client";

import { useEffect, useRef, useState } from "react";
import {
  trackSessionStart,
  trackSessionEnd,
  trackUserMessage,
  trackBotMessage,
  trackFallback,
  trackError,
} from "@/lib/analytics";

// Add custom styles for smooth animations
const customStyles = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
  
  .glass-effect {
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
  
  /* Ensure transparent background for embedded chatbot */
  html, body {
    background: transparent !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  
  /* Responsive adjustments for mobile */
  @media (max-width: 768px) {
    .chatbot-widget-open {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      border-radius: 0 !important;
    }
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = customStyles;
  document.head.appendChild(styleSheet);
}

type BotMeta = { name?: string; instructions?: string; color?: string } | null;

export default function ChatbotClient({
  botId,
  botMeta,
}: {
  botId: string;
  botMeta?: BotMeta;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Notify parent window about chatbot state changes for iframe resizing
  useEffect(() => {
    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "CHATBOT_RESIZE",
          isOpen: isOpen,
        },
        "*"
      );
    }
  }, [isOpen]);

  // Listen for window resize messages from parent
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "WINDOW_RESIZE") {
        // Handle any responsive adjustments if needed
        // The iframe sizing is handled by the parent window
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Hide global Navbar and Footer when this chatbot client is mounted.
  // We store previous inline display values and restore them on unmount so
  // this page can be embedded or used standalone without the site chrome.
  useEffect(() => {
    if (typeof document === "undefined") return;
    try {
      const path = window.location.pathname || "";
      // Only hide site chrome when we're on the chatbot route (safety check)
      if (!path.startsWith("/chatbot")) return;

      const header = document.querySelector("header") as HTMLElement | null;
      const footer = document.querySelector("footer") as HTMLElement | null;
      const prevHeaderDisplay = header ? header.style.display : null;
      const prevFooterDisplay = footer ? footer.style.display : null;

      if (header) {
        header.style.display = "none";
      }
      if (footer) {
        footer.style.display = "none";
      }

      // Also remove top padding on the main element if present (root layout adds pt-16)
      const main = document.querySelector("main") as HTMLElement | null;
      const prevMainPadding = main ? main.style.paddingTop : null;
      if (main) main.style.paddingTop = "0";

      return () => {
        if (header) header.style.display = prevHeaderDisplay ?? "";
        if (footer) footer.style.display = prevFooterDisplay ?? "";
        if (main) main.style.paddingTop = prevMainPadding ?? "";
      };
    } catch (e) {
      // Don't block the UI if DOM operations fail
      console.warn("Could not hide site chrome:", e);
    }
  }, []);

  // derive a color to use, fallback to brand blue
  const color = botMeta?.color ?? "#3b82f6";

  // Create a lighter variant of the color for subtle accents
  const lightColor = color + "20"; // 20% opacity
  const mediumColor = color + "10"; // 10% opacity

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setIsTyping(true);

    // Track user message
    trackUserMessage(botId, userMsg);

    const startTime = Date.now();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_id: botId, message: userMsg }),
      });
      const data = await res.json();
      const responseTime = Date.now() - startTime;
      const reply =
        data?.reply || data?.error || "Sorry, something went wrong.";

      // Detect if it's a fallback response
      const isFallback =
        data?.is_fallback ||
        reply.toLowerCase().includes("i don't know") ||
        reply.toLowerCase().includes("i'm not sure") ||
        reply.toLowerCase().includes("i couldn't") ||
        data?.error !== undefined;

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      // Track bot response
      trackBotMessage(botId, reply, responseTime, isFallback);

      // Track explicit fallback if detected
      if (isFallback) {
        trackFallback(botId, userMsg);
      }
    } catch (e) {
      console.error("chat send error", e);
      const errorMsg = "Error sending message.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: errorMsg },
      ]);

      // Track error
      trackError(botId, String(e));
      trackFallback(botId, userMsg);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    // Start minimized for cleaner embed experience
    setIsOpen(false);

    // Track session start when component mounts
    trackSessionStart(botId);

    // Track session end when component unmounts or page unloads
    const handleUnload = () => {
      trackSessionEnd(botId);
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      trackSessionEnd(botId);
    };
  }, [botId]);

  // auto-scroll to bottom when messages change
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div
      className="h-full w-full flex items-end justify-end box-border p-0"
      style={{ background: "transparent" }}
    >
      {/* Floating widget container */}
      <div
        className={`relative transition-all duration-500 ease-out transform ${
          isOpen
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-8 opacity-0 scale-95 pointer-events-none"
        }`}
        style={{
          width: isOpen ? "100%" : "auto",
          height: isOpen ? "100%" : "auto",
        }}
        aria-hidden={!isOpen}
      >
        <div
          className={`bg-white rounded-3xl shadow-xl overflow-hidden ${
            isOpen ? "chatbot-widget-open" : ""
          }`}
          style={{
            width: "100%",
            height: "100%",
            maxWidth: "420px",
            maxHeight: "720px",
            minWidth: "320px",
            minHeight: "480px",
            border: `1px solid ${mediumColor}`,
            backdropFilter: "blur(10px)",
          }}
        >
          {/* Header - More elegant design */}
          <div
            className="px-6 py-4 flex items-center justify-between relative"
            style={{
              background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
              color: "white",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-11 h-11 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center font-semibold text-lg shadow-lg"
                style={{ border: "2px solid rgba(255,255,255,0.3)" }}
              >
                {botMeta?.name ? botMeta.name[0].toUpperCase() : "✨"}
              </div>
              <div className="flex-1">
                <div className="font-medium text-lg leading-tight">
                  {botMeta?.name ?? "AI Assistant"}
                </div>
                <div className="text-sm opacity-85 font-light">
                  Always here to help
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Minimize chat"
              className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 hover:scale-110"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {/* Messages - Enhanced design */}
          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
            style={{
              height: "calc(100% - 140px)", // Account for header and input area
              background: `linear-gradient(to bottom, ${mediumColor} 0%, rgba(249,250,251,0.5) 100%)`,
            }}
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div
                  className="w-16 h-16 rounded-full mb-4 flex items-center justify-center text-2xl"
                  style={{ background: lightColor, color: color }}
                >
                  👋
                </div>
                <div className="text-gray-600 font-medium mb-2">
                  "Hi there! How can I help you today?"
                </div>
                <div className="text-sm text-gray-400">
                  Type a message to get started
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                } animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl font-medium text-sm leading-relaxed ${
                    m.role === "user"
                      ? "text-white shadow-lg"
                      : "bg-white text-gray-800 shadow-md border border-gray-100"
                  }`}
                  style={
                    m.role === "user"
                      ? {
                          background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
                          borderTopRightRadius: "6px",
                        }
                      : {
                          borderTopLeftRadius: "6px",
                        }
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div
                  className="bg-white px-4 py-3 rounded-2xl shadow-md border border-gray-100"
                  style={{ borderTopLeftRadius: "6px" }}
                >
                  <div className="flex space-x-1.5">
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: color, animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        backgroundColor: color,
                        animationDelay: "150ms",
                      }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        backgroundColor: color,
                        animationDelay: "300ms",
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input area - Enhanced design */}
          <div className="px-6 py-4 bg-white border-t border-gray-100">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Ask me anything..."
                  className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                  style={
                    {
                      "--tw-ring-color": lightColor,
                    } as React.CSSProperties
                  }
                  disabled={isTyping}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                className="p-3 rounded-2xl text-white font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                style={{
                  background:
                    !input.trim() || isTyping
                      ? "#9ca3af"
                      : `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                }}
                aria-label="Send message"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Minimized floating button (when closed) - Enhanced design */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
          className="absolute bottom-0 right-0 z-50 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-3xl group"
          style={{
            background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
            color: "white",
            border: "3px solid rgba(255,255,255,0.2)",
          }}
        >
          <div className="flex flex-col items-center justify-center">
            <div className="text-lg font-semibold mb-0.5">
              {botMeta?.name ? botMeta.name[0].toUpperCase() : "💬"}
            </div>
            <div className="w-2 h-2 bg-white rounded-full opacity-75 group-hover:animate-pulse"></div>
          </div>

          {/* Subtle pulsing ring animation */}
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: color }}
          ></div>
        </button>
      )}
    </div>
  );
}
