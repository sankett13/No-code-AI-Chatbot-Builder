import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import documentProcessor from "../../../lib/documentProcessor";

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization header" },
        { status: 401 }
      );
    }

    // Create authenticated Supabase client
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const instructions = formData.get("instructions") as string;
    const color = formData.get("color") as string;
    const file = formData.get("file") as File | null;

    if (!name) {
      return NextResponse.json(
        { error: "Bot name is required" },
        { status: 400 }
      );
    }

    let knowledgeFileUrl = null;
    let knowledgeFileName = null;

    // Upload file to Supabase storage if provided
    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("bot-knowledge")
        .upload(fileName, file);

      if (uploadError) {
        console.error("File upload error:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload file" },
          { status: 500 }
        );
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from("bot-knowledge")
        .getPublicUrl(fileName);

      knowledgeFileUrl = urlData.publicUrl;
      knowledgeFileName = file.name;
    }

    // Insert bot configuration into database
    const { data: bot, error: dbError } = await supabase
      .from("bots")
      .insert({
        user_id: user.id,
        name,
        instructions,
        color,
        knowledge_file_url: knowledgeFileUrl,
        knowledge_file_name: knowledgeFileName,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to create bot" },
        { status: 500 }
      );
    }

    // If a file was uploaded, extract text from it and insert chunks+embeddings
    if (file) {
      try {
        // Process the uploaded document and get chunks + embeddings
        const { chunks, embeddings } =
          await documentProcessor.processUploadedDocument(file);

        console.log(
          `Processed file ${file.name}: ${chunks.length} chunks, ${embeddings.length} embeddings`
        );

        if (chunks.length !== embeddings.length) {
          console.warn("Chunks and embeddings count mismatch.");
        }

        // Prepare rows for insertion into document_chunks
        const rows = chunks.map((content, i) => ({
          bot_id: bot.id,
          content,
          embedding: embeddings[i],
          metadata: {
            source: knowledgeFileName ?? file.name,
            chunk_index: i,
            length: content.length,
          },
        }));

        // Insert into document_chunks using the authenticated supabase client
        const { data: insertData, error: insertError } = await supabase
          .from("document_chunks")
          .insert(rows);

        if (insertError) {
          console.error("Failed to insert document chunks:", insertError);
          // Update bot processing status to failed
          await supabase
            .from("bots")
            .update({ processing_status: "failed" })
            .eq("id", bot.id);
        } else {
          const insertedCount = Array.isArray(insertData)
            ? (insertData as any[]).length
            : rows.length;
          console.log(`Inserted ${insertedCount} chunks for bot ${bot.id}`);

          // Update bot's processing status and chunks_count
          await supabase
            .from("bots")
            .update({
              processing_status: "processed",
              chunks_count: insertedCount,
            })
            .eq("id", bot.id);
        }
      } catch (error) {
        console.error("Document processing failed:", error);
        console.warn(
          "Document processing failed but bot was created successfully"
        );
        // mark bot as failed
        try {
          await supabase
            .from("bots")
            .update({ processing_status: "failed" })
            .eq("id", bot.id);
        } catch (e) {
          console.error("Failed to update bot status:", e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      bot: {
        id: bot.id,
        name: bot.name,
        instructions: bot.instructions,
        color: bot.color,
        knowledge_file_name: bot.knowledge_file_name,
        processing_status: bot.processing_status,
        chunks_count: bot.chunks_count,
        created_at: bot.created_at,
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization header" },
        { status: 401 }
      );
    }

    // Create authenticated Supabase client
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get all bots for the user
    const { data: bots, error: dbError } = await supabase
      .from("bots")
      .select(
        "id, name, instructions, color, knowledge_file_name, processing_status, chunks_count, created_at, updated_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch bots" },
        { status: 500 }
      );
    }

    return NextResponse.json({ bots });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
