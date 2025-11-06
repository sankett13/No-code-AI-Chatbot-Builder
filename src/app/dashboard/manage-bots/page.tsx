// app/dashboard/manage-bots/page.tsx

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import BotAnalytics from "@/components/dashboard/BotAnalytics";

type Bot = {
  id: string;
  name: string;
  instructions: string;
  processing_status?: string;
  chunks_count?: number;
  knowledge_file_name?: string;
  showEmbed?: boolean;
};

type Message = {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
};

export default function ManageBotsPage() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBot, setActiveBot] = useState<Bot | null>(null);
  const [analyticsBot, setAnalyticsBot] = useState<Bot | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);

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
        .select("id, name, instructions, chunks_count, knowledge_file_name")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching bots:", error);
      } else {
        setBots(data as Bot[]);
      }
      setLoading(false);
    };

    fetchBots();
  }, []);

  const closeModal = () => {
    setActiveBot(null);
    setMessages([]);
    setInputMessage("");
    setIsTyping(false);
  };

  const openBotTest = (bot: Bot) => {
    setActiveBot(bot);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !activeBot) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      // Get user session for authentication
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token && {
            Authorization: `Bearer ${session.access_token}`,
          }),
        },
        body: JSON.stringify({
          bot_id: activeBot.id,
          message: userMessage.text,
        }),
      });

      const data = await response.json();

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text:
          data.reply ||
          data.error ||
          "Sorry, I couldn't process your message at this time.",
        isBot: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, there was an error processing your message. Please try again.",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] text-gray-800 rounded-lg shadow-md">
        <div className="flex items-center text-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800 mr-3"></div>
          Loading Bots...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Copy confirmation toast (top-right) */}
        {copyToast && (
          <div className="fixed top-5 right-5 z-50">
            <div
              role="status"
              aria-live="polite"
              className="bg-[#141414] text-white px-4 py-2 rounded shadow-md"
            >
              {copyToast}
            </div>
          </div>
        )}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Your AI Assistant Collection
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage, test, and deploy your intelligent chatbots with ease
          </p>
        </div>

        {bots.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] bg-white rounded-2xl shadow-lg">
            <div className="text-center p-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                No Bots Created Yet
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Start building your first AI assistant to help automate tasks
                and engage with users
              </p>
              <button className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg">
                Create Your First Bot
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {bots.map((bot) => (
              <div
                key={bot.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
              >
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mr-4">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 truncate">
                      {bot.name}
                    </h2>
                  </div>

                  <p className="text-gray-600 mb-8 line-clamp-4 leading-relaxed">
                    {bot.instructions}
                  </p>

                  <div className="flex flex-col space-y-3">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => openBotTest(bot)}
                        className="flex-1 px-6 py-3 bg-[#141414] text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-md"
                      >
                        Test Bot
                      </button>

                      <button
                        onClick={() => setAnalyticsBot(bot)}
                        className="px-6 py-3 bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200 transition-all duration-200 shadow-md"
                        title="View Analytics"
                      >
                        📊
                      </button>

                      <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200 shadow-md">
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          setBots((prev) =>
                            prev.map((b) =>
                              b.id === bot.id
                                ? { ...b, showEmbed: !b.showEmbed }
                                : { ...b, showEmbed: false }
                            )
                          )
                        }
                        className="px-6 py-3 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-all duration-200 shadow-md"
                      >
                        Embed
                      </button>
                    </div>

                    {bot.showEmbed && (
                      <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-700 font-medium mb-2">
                          Copy & paste this code into your website:
                        </p>
                        {(() => {
                          const embedSnippet = `<script src="${process.env.NEXT_PUBLIC_APP_URL}/api/embed/${bot.id}"></script>`;
                          return (
                            <>
                              <textarea
                                readOnly
                                className="w-full text-xs p-2 border rounded-md bg-white font-mono"
                                rows={2}
                                value={embedSnippet}
                                aria-label={`Embed snippet for ${bot.name}`}
                              />
                              <div className="flex items-center justify-between mt-2">
                                <button
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(
                                        embedSnippet
                                      );
                                      setCopyToast("Copied to clipboard");
                                      // clear after 3s
                                      setTimeout(
                                        () => setCopyToast(null),
                                        3000
                                      );
                                    } catch (e) {
                                      console.error("Clipboard copy failed", e);
                                      setCopyToast("Failed to copy");
                                      setTimeout(
                                        () => setCopyToast(null),
                                        3000
                                      );
                                    }
                                  }}
                                  className="mt-0 text-sm text-blue-600 hover:underline"
                                >
                                  Copy to clipboard
                                </button>

                                
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chat Modal */}
        {activeBot && (
          <div className="fixed top-20 right-8 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-96 h-[70vh] flex flex-col border border-gray-200">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {activeBot.name}
                    </h2>
                    <p className="text-sm text-gray-500">AI Assistant</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <svg
                    className="w-6 h-6 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.isBot ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                        message.isBot
                          ? "bg-white text-gray-800 shadow-md"
                          : "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.text}</p>
                      <p
                        className={`text-xs mt-2 ${
                          message.isBot ? "text-gray-500" : "text-blue-100"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white px-4 py-3 rounded-2xl shadow-md">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-6 border-t border-gray-200 bg-white">
                <div className="flex space-x-4">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={2}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Modal */}
        {analyticsBot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xl">📊</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {analyticsBot.name} - Analytics
                    </h2>
                    <p className="text-sm text-gray-500">Performance insights and metrics</p>
                  </div>
                </div>
                <button
                  onClick={() => setAnalyticsBot(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <svg
                    className="w-6 h-6 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Analytics Content */}
              <div className="p-6">
                <BotAnalytics botId={analyticsBot.id} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
