import ChatbotClient from "./ChatbotClient";

export default async function ChatbotPage({
  params,
}: {
  params: Promise<{ botId: string }>;
}) {
  const { botId } = await params; // ✅ unwrap the promise
  console.log("[chatbot page] botId:", botId);

  if (!botId) {
    return <div>Bot ID missing in URL</div>;
  }

  return <ChatbotClient botId={botId} />;
}
