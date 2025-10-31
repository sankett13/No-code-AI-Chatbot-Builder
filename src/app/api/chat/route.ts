import supabase from "@/lib/supabaseClient";
import { createClient } from "@supabase/supabase-js";
import {
  GoogleGenerativeAIEmbeddings,
  ChatGoogleGenerativeAI,
} from "@langchain/google-genai";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    console.log("[api/chat] incoming body:", body);

    const message = (body?.message ?? body?.text ?? null) as string | null;
    const botId = (body?.bot_id ?? body?.botId ?? null) as string | null;

    if (!message || !botId) {
      return new Response(
        JSON.stringify({ error: "missing bot_id or message" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // For public chatbot access, create a service client that bypasses RLS
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key bypasses RLS
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // If the client passed the user's access token, create a request-scoped Supabase client
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader ?? null;
    let db = supabase;
    if (token) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      try {
        db = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
      } catch (e) {
        console.warn(
          "[api/chat] failed to create request-scoped supabase client",
          e
        );
      }
    }

    // 1) Embed the incoming query using the Google Generative Embeddings
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
    });
    const queryEmbedding = await embeddings.embedQuery(message);

    console.log(
      "[api/chat] query embedding length:",
      queryEmbedding?.length ?? 0
    );

    // 2) Fetch document chunks for this bot and compute similarity client-side.
    // Use service client for public access to document chunks
    const { data: rows, error: fetchErr } = await serviceClient
      .from("document_chunks")
      .select("content,metadata,embedding")
      .eq("bot_id", botId)
      .limit(200);

    if (fetchErr) {
      console.error("[api/chat] failed to fetch document_chunks:", fetchErr);
    }

    const allChunks = (rows ?? []) as Array<{
      content: string;
      metadata?: any;
      embedding?: number[] | null;
    }>;

    // Normalize embeddings returned by Supabase/pgvector: they can come back as strings
    // like "[0.1,0.2]" or "{0.1,0.2}" depending on the client. Try to coerce them
    // to number[] so cosine similarity works.
    function parseEmbedding(v: any): number[] | null {
      if (!v && v !== 0) return null;
      if (Array.isArray(v)) return v.map((x) => Number(x));
      if (typeof v === "string") {
        // remove braces/brackets and possible surrounding whitespace
        const cleaned = v
          .replace(/^\[|\]$/g, "")
          .replace(/^\{|\}$/g, "")
          .trim();
        if (!cleaned) return null;
        const parts = cleaned.split(/[ ,]+/).filter(Boolean);
        const nums = parts.map((p) => Number(p));
        if (nums.some((n) => Number.isNaN(n))) return null;
        return nums;
      }
      // handle postgres numeric array object or other shapes
      if (typeof v === "object" && v !== null) {
        // try common fields
        if (Array.isArray((v as any).data))
          return (v as any).data.map((x: any) => Number(x));
        // attempt to stringify and parse
        try {
          const s = JSON.stringify(v);
          const m = s.match(/-?\d+(?:\.\d+)?/g);
          if (m) return m.map((x) => Number(x));
        } catch (e) {
          return null;
        }
      }
      return null;
    }

    // attach normalized embeddings
    const normChunks = allChunks.map((c) => ({
      ...c,
      embedding: parseEmbedding(c.embedding),
    }));

    // debug logging to help when no chunks are retrieved/matched
    const embeddingsFound = normChunks.filter((c) =>
      Array.isArray(c.embedding)
    ).length;
    console.log(
      `[api/chat] fetched rows: ${allChunks.length}, with parsed embeddings: ${embeddingsFound}`
    );
    if (allChunks.length > 0 && embeddingsFound === 0) {
      console.warn(
        "[api/chat] no parsable embeddings found in document_chunks - sample row:",
        allChunks[0]
      );
    }

    function cosine(a: number[], b: number[]) {
      let dot = 0,
        na = 0,
        nb = 0;
      for (let i = 0; i < a.length; i++) {
        const va = a[i] ?? 0;
        const vb = b[i] ?? 0;
        dot += va * vb;
        na += va * va;
        nb += vb * vb;
      }
      if (na === 0 || nb === 0) return 0;
      return dot / (Math.sqrt(na) * Math.sqrt(nb));
    }

    const scored = normChunks
      .map((c) => ({
        ...c,
        score:
          Array.isArray(c.embedding) && Array.isArray(queryEmbedding)
            ? cosine(queryEmbedding as number[], c.embedding as number[])
            : -1,
      }))
      .filter((c) => typeof c.score === "number")
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 5);

    const chunks = scored;

    console.log("[api/chat] retrieved chunks:", chunks.length);

    // Get bot details for better context using service client (bypasses RLS)
    const { data: botData, error: botError } = await serviceClient
      .from("bots")
      .select("name, instructions")
      .eq("id", botId)
      .single();

    if (botError) {
      console.error("[api/chat] failed to fetch bot details:", botError);
    }

    const contextText = chunks
      .map((c) => {
        // sanitize metadata before including it in the prompt so internal fields
        // like `chunk_index` are not exposed to the LLM or user
        const meta = c.metadata ? { ...c.metadata } : null;
        if (meta && Object.prototype.hasOwnProperty.call(meta, "chunk_index")) {
          delete meta.chunk_index;
        }
        return `- ${c.content}${
          meta ? ` (meta: ${JSON.stringify(meta)})` : ""
        }`;
      })
      .join("\n");

    // 3) Call the Google Generative LLM via LangChain to generate a reply using the retrieved context
    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: 0.7,
    });

    // Handle cases where no knowledge base exists
    let systemPrompt = "";
    let prompt = "";

    if (chunks.length === 0) {
      // No knowledge base - use bot instructions and general AI capabilities
      const botName = botData?.name || "AI Assistant";
      const botInstructions =
        botData?.instructions || "I'm an AI assistant here to help you.";

      systemPrompt = `You are ${botName}, an AI assistant. ${botInstructions}

Respond naturally and helpfully to user questions. Use plain, conversational text without any markup or formatting. Be friendly, concise, and informative.

Since you don't have access to specific knowledge documents, provide general helpful responses based on your training. If the user asks about specific company information, services, or documents that you don't have access to, politely explain that you would need more specific information or documents to provide detailed answers about those topics.`;

      prompt = `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`;
    } else {
      // Has knowledge base - use context-based response
      systemPrompt = `You are a helpful AI assistant. Use plain, conversational text without any markup or formatting. Be friendly and informative.

Use the provided context to answer questions accurately. If the context doesn't contain enough information to fully answer a question, say so and provide what information you can from the context.

Don't reveal internal metadata or cite sources unless specifically asked. Keep responses natural and conversational.`;

      prompt = `${systemPrompt}\n\nContext from knowledge base:\n${contextText}\n\nUser question: ${message}\n\nAssistant:`;
    }

    console.log("[api/chat] constructed prompt:", prompt);
    let llmReply = "";
    try {
      const response = await llm.invoke(prompt);
      const llmReply = response.content;

      console.log("[api/chat] LLM response:", llmReply);
      return new Response(JSON.stringify({ ok: true, reply: llmReply }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.warn(
        "[api/chat] LLM call failed, falling back to simple reply",
        e
      );
      llmReply = `I couldn't generate a full answer (LLM error). Here is the context I found:\n${contextText}`;
    }

    // sanitize sources returned to the client (remove internal chunk_index)
    const sanitizedSources = chunks.map((c) => {
      const meta = c.metadata ? { ...c.metadata } : null;
      if (meta && Object.prototype.hasOwnProperty.call(meta, "chunk_index")) {
        delete meta.chunk_index;
      }
      return {
        content: c.content,
        metadata: meta,
        score: c.score,
      };
    });

    return new Response(
      JSON.stringify({ ok: true, reply: llmReply, sources: sanitizedSources }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[api/chat] error:", err);
    return new Response(JSON.stringify({ error: "internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
