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
      iframe.style.bottom = "0px";
      iframe.style.right = "0px";
      iframe.style.width = "100vw";
      iframe.style.height = "100vh";
      iframe.style.border = "none";
      iframe.style.zIndex = "9999";
      iframe.style.background = "transparent";
      iframe.style.pointerEvents = "none";
      iframe.setAttribute("allowtransparency", "true");
      
      // Allow pointer events only on the chat widget area
      iframe.addEventListener('load', function() {
        iframe.style.pointerEvents = "auto";
      });
      
      document.body.appendChild(iframe);
    })();
  `;

  return new NextResponse(script, {
    headers: { "Content-Type": "application/javascript" },
  });
}
