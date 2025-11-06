export default function ChatbotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="h-screen w-screen"
      style={{
        background: "transparent",
        margin: 0,
        padding: 0,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}
