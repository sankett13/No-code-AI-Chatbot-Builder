import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  _req: Request,
  context: { params: Promise<{ botId?: string }> }
) {
  const { botId } = await context.params;

  if (!botId) {
    return NextResponse.json({ error: "Bot ID is required" }, { status: 400 });
  }

  try {
    // Use service role to bypass RLS for public bot metadata
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceKey) {
      return NextResponse.json(
        { error: "Service configuration error" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase
      .from("bots")
      .select("name, color, instructions")
      .eq("id", botId)
      .single();

    if (error) {
      console.error("Error fetching bot:", error);
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    // Return only public metadata
    return NextResponse.json({
      name: data.name,
      color: data.color || "#3b82f6",
      instructions: data.instructions,
    });
  } catch (error) {
    console.error("Error in bot API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
