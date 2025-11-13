import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  context: { params: Promise<{ botId?: string }> }
) {
  // 👇 Unwrap the params promise first
  const { botId } = await context.params;

  console.log("[embed route] botId:", botId);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!botId) {
    return new NextResponse("console.error('Missing botId in URL');", {
      headers: { "Content-Type": "application/javascript" },
    });
  }

  const script = `
    (function() {
      const iframe = document.createElement("iframe");
      iframe.src = "${baseUrl}/chatbot/${botId}";
      iframe.style.position = "fixed";
      iframe.style.bottom = "24px";
      iframe.style.right = "24px";
      iframe.style.border = "none";
      iframe.style.zIndex = "9999";
      iframe.style.background = "transparent";
      iframe.style.transition = "all 0.3s ease";
      iframe.setAttribute("allowtransparency", "true");
      iframe.setAttribute("title", "AI Chatbot Widget");
      iframe.id = "chatbot-iframe-${botId}";
      
      // Start with minimized size (just the floating button)
      iframe.style.width = "80px";
      iframe.style.height = "80px";
      iframe.style.pointerEvents = "auto";
      
      // Ensure iframe doesn't exceed viewport on mobile
      iframe.style.maxWidth = "calc(100vw - 48px)";
      iframe.style.maxHeight = "calc(100vh - 48px)";
      
      // Listen for resize messages from the chatbot iframe
      window.addEventListener("message", function(event) {
        if (event.origin !== "${baseUrl}") return;
        
        if (event.data.type === "CHATBOT_RESIZE") {
          const { isOpen } = event.data;
          
          if (isOpen) {
            // Expanded size for open chatbot
            iframe.style.width = "420px";
            iframe.style.height = "720px";
            
            // Adjust position for mobile responsiveness
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
              iframe.style.bottom = "0px";
              iframe.style.right = "0px";
              iframe.style.left = "0px";
              iframe.style.width = "100vw";
              iframe.style.height = "100vh";
              iframe.style.maxWidth = "100vw";
              iframe.style.maxHeight = "100vh";
            } else {
              iframe.style.bottom = "24px";
              iframe.style.right = "24px";
              iframe.style.left = "auto";
              iframe.style.width = "420px";
              iframe.style.height = "720px";
              iframe.style.maxWidth = "calc(100vw - 48px)";
              iframe.style.maxHeight = "calc(100vh - 48px)";
            }
          } else {
            // Minimized size for closed chatbot (just floating button)
            iframe.style.width = "80px";
            iframe.style.height = "80px";
            iframe.style.bottom = "24px";
            iframe.style.right = "24px";
            iframe.style.left = "auto";
            iframe.style.maxWidth = "80px";
            iframe.style.maxHeight = "80px";
          }
        }
      });
      
      // Handle window resize for mobile responsiveness
      window.addEventListener("resize", function() {
        // Send current window size to iframe
        iframe.contentWindow && iframe.contentWindow.postMessage({
          type: "WINDOW_RESIZE",
          width: window.innerWidth,
          height: window.innerHeight
        }, "${baseUrl}");
      });
      
      document.body.appendChild(iframe);
    })();
  `;

  return new NextResponse(script, {
    headers: { "Content-Type": "application/javascript" },
  });
}
