import ChatbotClient from "./ChatbotClient";
import { createClient } from "@supabase/supabase-js";

export default async function ChatbotPage({
  params,
}: {
  params: Promise<{ botId: string; botMeta?: any }>;
}) {
  const { botId } = await params; // unwrap the promise
  console.log("[chatbot page] botId:", botId);

  if (!botId) {
    return <div>Bot ID missing in URL</div>;
  }

  // Use the service role key on the server to fetch public bot metadata (bypasses RLS)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let botData: { name?: string; instructions?: string; color?: string } | null =
    null;

  if (serviceKey) {
    try {
      const service = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data, error } = await service
        .from("bots")
        .select("name, instructions, color")
        .eq("id", botId)
        .single();
      if (!error && data) botData = data as any;
    } catch (e) {
      console.error("Failed to fetch bot metadata with service key:", e);
    }
  }

  // Fallback: render client-only component which will try public APIs
  return (
    <div style={{ background: "transparent", height: "100vh", width: "100vw" }}>
      <ChatbotClient botId={botId} botMeta={botData} />
    </div>
  );
}
