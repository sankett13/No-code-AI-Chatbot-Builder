import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(
  req: Request,
  context: { params: Promise<{ botId: string }> }
) {
  const { botId } = await context.params;

  console.log("Received botId:", botId);

  const formData = await req.formData();
  const systemInstructions = formData.get("systemInstructions") as string;
  const newDocument = formData.get("newDocument") as File;

  console.log("Received systemInstructions:", systemInstructions);
  console.log("Received newDocument:", newDocument);

  if (!botId || !systemInstructions) {
    console.error("Missing required fields", { botId, systemInstructions });
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    // Log botId details for debugging
    console.log("Debug: botId details:", {
      botId,
      length: botId.length,
      trimmed: botId.trim(),
    });

    // Log the type of botId for debugging
    console.log("Debug: botId type:", {
      value: botId,
      type: typeof botId,
    });

    // Explicitly cast botId to UUID
    const parsedBotId = botId.trim();

    // Debug: Fetch the bot using a raw SQL query as a fallback
    const { data: botData, error: fetchError } = await supabase.rpc(
      "fetch_bot_by_id",
      { bot_id: parsedBotId }
    );

    console.log("Debug: Fetched bot data:", { botData, fetchError });

    if (fetchError || !botData) {
      console.error("Failed to fetch bot with the given botId", fetchError);
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    // Log botId and systemInstructions before the update query
    console.log("Debug: Updating bot with:", {
      botId,
      systemInstructions,
    });

    // Update system instructions in the database
    const { data: updateData, error: updateError } = await supabase
      .from("bots")
      .update({ instructions: systemInstructions })
      .eq("id", botId);

    console.log("Debug: Supabase update response:", {
      updateData,
      updateError,
    });

    if (updateError) {
      console.error("Failed to update system instructions", updateError);
      return NextResponse.json(
        { error: "Failed to update system instructions" },
        { status: 500 }
      );
    }

    if (newDocument) {
      // Delete previous embeddings for the bot
      const { error: deleteError } = await supabase
        .from("embeddings")
        .delete()
        .eq("bot_id", botId);

      if (deleteError) {
        console.error("Failed to delete previous embeddings", deleteError);
        return NextResponse.json(
          { error: "Failed to delete previous embeddings" },
          { status: 500 }
        );
      }

      // Upload new document to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(`bots/${botId}/${newDocument.name}`, newDocument.stream());

      console.log("Upload data:", uploadData);

      if (uploadError) {
        console.error("Failed to upload new document", uploadError);
        return NextResponse.json(
          { error: "Failed to upload new document" },
          { status: 500 }
        );
      }

      // Update document path in the database
      const { error: docUpdateError } = await supabase
        .from("bots")
        .update({ document_path: uploadData.path })
        .eq("id", botId);

      if (docUpdateError) {
        console.error("Failed to update document path", docUpdateError);
        return NextResponse.json(
          { error: "Failed to update document path" },
          { status: 500 }
        );
      }
    }

    console.log("Bot updated successfully");
    return NextResponse.json({ message: "Bot updated successfully" });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
