import React from "react";

type Bot = {
  id: string;
  name: string;
  instructions?: string | null;
  color?: string | null;
  knowledge_file_name?: string | null;
  processing_status?: string | null;
  chunks_count?: number | null;
  created_at?: string | null;
};

type ManageBotsProps = {
  bots: Bot[];
  loading: boolean;
  error: string | null;
  setBots: React.Dispatch<React.SetStateAction<Bot[]>>;
  openTest: (bot: Bot) => void;
  handleDelete: (botId: string) => void;
};

export default function ManageBots({
  bots,
  loading,
  error,
  setBots,
  openTest,
  handleDelete,
}: ManageBotsProps) {
  return (
    <section>
      <h2>Your bots</h2>
      <p>Manage, edit, delete or test your bots from here.</p>
      <div>
        {loading ? (
          <div>Loading bots…</div>
        ) : error ? (
          <div>{error}</div>
        ) : bots.length === 0 ? (
          <div>No bots yet. Create one to get started.</div>
        ) : (
          <div>
            {bots.map((bot) => (
              <div key={bot.id}>
                <div>
                  <div>{bot.name?.[0] ?? "B"}</div>
                  <div>
                    <div>{bot.name}</div>
                    <div>{bot.instructions ?? <em>No instructions</em>}</div>
                    <div>
                      {bot.chunks_count
                        ? `${bot.chunks_count} chunks`
                        : "No chunks"}{" "}
                      • {bot.processing_status ?? "n/a"} •{" "}
                      {bot.created_at
                        ? new Date(bot.created_at).toLocaleString()
                        : "-"}
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() =>
                      (window.location.href = `/dashboard/create-bot?edit=${bot.id}`)
                    }
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDelete(bot.id)}>Delete</button>
                  <button onClick={() => openTest(bot)}>Test</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
