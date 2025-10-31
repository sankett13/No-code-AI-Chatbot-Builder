import { supabase } from "@/lib/supabaseClient";

export default function Sidebar({
  userEmail,
  onLogout,
}: {
  userEmail: string;
  onLogout?: () => void;
}) {
  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    // Default logout logic: delete session and redirect to login
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("token");
    } catch (e) {
      console.error("Failed to log out", e);
    }
    window.location.href = "/login";
  };

  return (
    <aside className="w-64 bg-[#141414] text-white h-screen p-6 flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-400">{userEmail}</p>
      </div>
      <nav className="space-y-6 flex-grow">
        <a
          href="/dashboard"
          className="block text-gray-300 hover:text-white text-lg font-medium"
        >
          Bot Analytics
        </a>
        <a
          href="/dashboard/manage-bots"
          className="block text-gray-300 hover:text-white text-lg font-medium"
        >
          Manage Bots
        </a>
        <a
          href="/dashboard/create-bot"
          className="block text-gray-300 hover:text-white text-lg font-medium"
        >
          Create Bot
        </a>
      </nav>

      <div className="mt-6">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
