import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  context: { params: Promise<{ botId?: string }> }
) {
  const { botId } = await context.params;

  console.log("[widget route] botId:", botId);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!botId) {
    return new NextResponse("console.error('Missing botId in URL');", {
      headers: { "Content-Type": "application/javascript" },
    });
  }

  const script = `
    (function() {
      // Prevent multiple instances
      if (window.chatbotWidget_${botId}) return;
      window.chatbotWidget_${botId} = true;

      // Create chatbot container
      const chatbotContainer = document.createElement("div");
      chatbotContainer.id = "chatbot-widget-${botId}";
      chatbotContainer.style.cssText = \`
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        transition: all 0.3s ease;
      \`;

      // Chatbot state
      let isOpen = false;
      let botData = null;
      let messages = [];
      let isTyping = false;

      // Fetch bot metadata
      async function fetchBotData() {
        try {
          const response = await fetch(\`${baseUrl}/api/bots/\${botId}\`);
          if (response.ok) {
            botData = await response.json();
          }
        } catch (e) {
          console.warn('Could not fetch bot metadata:', e);
        }
      }

      // Create floating button
      function createFloatingButton() {
        const button = document.createElement("button");
        const color = botData?.color || "#3b82f6";
        
        button.style.cssText = \`
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, \${color} 0%, \${color}dd 100%);
          color: white;
          cursor: pointer;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 600;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        \`;
        
        button.innerHTML = \`
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="font-size: 18px; margin-bottom: 2px;">
              \${botData?.name ? botData.name[0].toUpperCase() : "💬"}
            </div>
            <div style="width: 8px; height: 8px; background: white; border-radius: 50%; opacity: 0.8;"></div>
          </div>
          <div style="position: absolute; inset: 0; border-radius: 50%; background: \${color}; opacity: 0.2; animation: pulse 2s infinite;"></div>
        \`;
        
        button.onmouseover = () => {
          button.style.transform = "scale(1.1)";
          button.style.boxShadow = "0 12px 48px rgba(0,0,0,0.3)";
        };
        
        button.onmouseout = () => {
          button.style.transform = "scale(1)";
          button.style.boxShadow = "0 8px 32px rgba(0,0,0,0.2)";
        };
        
        button.onclick = () => openChatbot();
        
        return button;
      }

      // Create chat window
      function createChatWindow() {
        const color = botData?.color || "#3b82f6";
        const isMobile = window.innerWidth <= 768;
        
        const chatWindow = document.createElement("div");
        chatWindow.style.cssText = \`
          position: fixed;
          \${isMobile ? \`
            top: 0; left: 0; right: 0; bottom: 0;
            width: 100vw; height: 100vh;
          \` : \`
            bottom: 24px; right: 24px;
            width: min(380px, calc(100vw - 60px)); 
            height: min(600px, calc(100vh - 60px));
          \`}
          background: white;
          border-radius: \${isMobile ? '0' : '20px'};
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 10000;
          transform: scale(0.8) translateY(20px);
          opacity: 0;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        \`;

        // Header
        const header = document.createElement("div");
        header.style.cssText = \`
          background: linear-gradient(135deg, \${color} 0%, \${color}dd 100%);
          color: white;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
          height: 80px;
          box-sizing: border-box;
        \`;
        
        header.innerHTML = \`
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600;">
              \${botData?.name ? botData.name[0].toUpperCase() : "✨"}
            </div>
            <div>
              <div style="font-weight: 600; font-size: 16px;">\${botData?.name || "AI Assistant"}</div>
              <div style="font-size: 12px; opacity: 0.9;">Online now</div>
            </div>
          </div>
          <button id="close-chat" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">
            ×
          </button>
        \`;

        // Messages container
        const messagesContainer = document.createElement("div");
        messagesContainer.id = "messages-container";
        messagesContainer.style.cssText = \`
          flex: 1;
          overflow: hidden;
          padding: 24px 20px;
          background: linear-gradient(to bottom, \${color}10 0%, rgba(249,250,251,0.5) 100%);
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 0;
        \`;
        
        // Remove all scrollbar styles since we're using overflow: hidden
        // messagesContainer.style.setProperty('-webkit-scrollbar', 'none');
        // messagesContainer.style.setProperty('-ms-overflow-style', 'none');

        // Input container
        const inputContainer = document.createElement("div");
        inputContainer.style.cssText = \`
          padding: 16px 20px;
          border-top: 1px solid #e5e7eb;
          background: white;
          display: flex;
          gap: 12px;
          align-items: center;
          flex-shrink: 0;
          height: 80px;
          box-sizing: border-box;
        \`;
        
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Type your message...";
        input.style.cssText = \`
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 24px;
          outline: none;
          font-size: 14px;
          transition: border-color 0.2s;
        \`;
        
        input.onfocus = () => input.style.borderColor = color;
        input.onblur = () => input.style.borderColor = "#e5e7eb";
        
        const sendButton = document.createElement("button");
        sendButton.style.cssText = \`
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: \${color};
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        \`;
        sendButton.innerHTML = "→";
        sendButton.onmouseover = () => sendButton.style.transform = "scale(1.1)";
        sendButton.onmouseout = () => sendButton.style.transform = "scale(1)";
        
        inputContainer.appendChild(input);
        inputContainer.appendChild(sendButton);
        
        chatWindow.appendChild(header);
        chatWindow.appendChild(messagesContainer);
        chatWindow.appendChild(inputContainer);

        // Event listeners
        header.querySelector("#close-chat").onclick = () => closeChatbot();
        
        const sendMessage = async () => {
          const message = input.value.trim();
          if (!message || isTyping) return;
          
          addMessage(message, false);
          input.value = "";
          
          isTyping = true;
          showTyping();
          
          try {
            const response = await fetch("${baseUrl}/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ bot_id: "${botId}", message })
            });
            
            const data = await response.json();
            const reply = data?.reply || data?.error || "Sorry, something went wrong.";
            
            hideTyping();
            addMessage(reply, true);
          } catch (e) {
            hideTyping();
            addMessage("Sorry, I couldn't process your message.", true);
          }
          
          isTyping = false;
        };
        
        sendButton.onclick = sendMessage;
        input.onkeypress = (e) => {
          if (e.key === "Enter") sendMessage();
        };

        return chatWindow;
      }

      // Message functions
      function addMessage(content, isBot) {
        const container = document.querySelector("#messages-container");
        if (!container) return;
        
        const messageDiv = document.createElement("div");
        messageDiv.style.cssText = \`
          display: flex;
          justify-content: \${isBot ? "flex-start" : "flex-end"};
          margin-bottom: 12px;
          opacity: 0;
          transform: translateY(10px);
          animation: fadeInUp 0.3s ease forwards;
        \`;
        
        const bubble = document.createElement("div");
        const color = botData?.color || "#3b82f6";
        bubble.style.cssText = \`
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.4;
          \${isBot 
            ? \`background: white; color: #374151; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-bottom-left-radius: 6px;\`
            : \`background: linear-gradient(135deg, \${color} 0%, \${color}cc 100%); color: white; border-bottom-right-radius: 6px;\`
          }
        \`;
        bubble.textContent = content;
        
        messageDiv.appendChild(bubble);
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
      }

      function showTyping() {
        const container = document.querySelector("#messages-container");
        if (!container) return;
        
        const typingDiv = document.createElement("div");
        typingDiv.id = "typing-indicator";
        typingDiv.style.cssText = \`
          display: flex;
          justify-content: flex-start;
          margin-bottom: 12px;
        \`;
        
        typingDiv.innerHTML = \`
          <div style="background: white; padding: 16px 20px; border-radius: 18px; border-bottom-left-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="display: flex; gap: 6px; align-items: center;">
              <div style="width: 8px; height: 8px; background: #6b7280; border-radius: 50%; animation: bounce 1.2s infinite ease-in-out;"></div>
              <div style="width: 8px; height: 8px; background: #6b7280; border-radius: 50%; animation: bounce 1.2s infinite ease-in-out 0.15s;"></div>
              <div style="width: 8px; height: 8px; background: #6b7280; border-radius: 50%; animation: bounce 1.2s infinite ease-in-out 0.3s;"></div>
            </div>
          </div>
        \`;
        
        container.appendChild(typingDiv);
        container.scrollTop = container.scrollHeight;
      }

      function hideTyping() {
        const typing = document.querySelector("#typing-indicator");
        if (typing) typing.remove();
      }

      // Main functions
      function openChatbot() {
        if (isOpen) return;
        isOpen = true;
        
        const button = chatbotContainer.querySelector("button");
        const chatWindow = createChatWindow();
        
        chatbotContainer.appendChild(chatWindow);
        button.style.display = "none";
        
        // Animate in
        requestAnimationFrame(() => {
          chatWindow.style.transform = "scale(1) translateY(0)";
          chatWindow.style.opacity = "1";
        });

        // Add welcome message if no previous messages
        if (messages.length === 0) {
          setTimeout(() => {
            addMessage("Hi there! How can I help you today?", true);
          }, 500);
        }
      }

      function closeChatbot() {
        if (!isOpen) return;
        isOpen = false;
        
        const chatWindow = chatbotContainer.querySelector("div:not(button)");
        const button = chatbotContainer.querySelector("button");
        
        if (chatWindow) {
          chatWindow.style.transform = "scale(0.8) translateY(20px)";
          chatWindow.style.opacity = "0";
          
          setTimeout(() => {
            if (chatWindow.parentNode) {
              chatWindow.parentNode.removeChild(chatWindow);
            }
            if (button) button.style.display = "flex";
          }, 300);
        }
      }

      // Initialize
      async function init() {
        // Add CSS animations
        const style = document.createElement("style");
        style.textContent = \`
          @keyframes pulse {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.4; }
          }
          @keyframes fadeInUp {
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes bounce {
            0%, 80%, 100% { 
              transform: translateY(0) scale(1); 
              opacity: 0.6;
            }
            40% { 
              transform: translateY(-8px) scale(1.1); 
              opacity: 1;
            }
          }
        \`;
        document.head.appendChild(style);
        
        await fetchBotData();
        
        const floatingButton = createFloatingButton();
        chatbotContainer.appendChild(floatingButton);
        document.body.appendChild(chatbotContainer);
        
        // Handle window resize
        window.addEventListener("resize", () => {
          if (isOpen) {
            closeChatbot();
            setTimeout(openChatbot, 100);
          }
        });
      }

      // Start the widget
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
      } else {
        init();
      }
    })();
  `;

  return new NextResponse(script, {
    headers: { "Content-Type": "application/javascript" },
  });
}
