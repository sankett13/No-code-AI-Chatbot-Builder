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
    // Some DB setups give an ambiguous-column error for the RPC function; to avoid
    // that, fetch embeddings and rank locally (ok for small-medium datasets).
    const { data: rows, error: fetchErr } = await db
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
      temperature: 0.2,
    });

    const systemPrompt = `You are a concise, strictly factual assistant. Use plain, unformatted text only — no Markdown, headings, bullets, bold, italics, HTML, code blocks, or any other markup. Do not prepend labels such as "Answer:" or "Suggestion:".

Respond directly and succinctly. Put each distinct fact, step, or instruction on its own line. Separate paragraphs or different parts with a single blank line. Keep the reply as short as possible while fully answering.

Only use information explicitly supported by the provided CONTEXT. Do not repeat or reveal context contents, internal metadata, source names, or chunk indices. Do not cite sources, speculate, or add unsupported details.

If the context does not provide enough information to answer, reply exactly:
I don't know.

If the user's request is ambiguous but can be resolved with a short clarification, ask one concise clarifying question on its own line (do not attempt to answer until clarified).

When giving ordered steps, use simple numbered lines (1. ..., 2. ...), one step per line.`;

    const prompt = `SYSTEM: ${systemPrompt}\n\nCONTEXT:\n${
      contextText || "(no relevant context found)"
    }\n\nUSER QUESTION:\n${message}\n\nProvide a concise answer and cite any context lines used.`;
    console.log("[api/chat] constructed prompt:", prompt);
    let llmReply = "";
    try {
      const response = await llm.invoke(prompt);
      const llmReply = response.content;

      //   // Try several possible method shapes that different langchain wrappers expose.
      //   if (typeof (llm as any).generate === "function") {
      //     // @ts-ignore
      //     const gen = await (llm as any).generate([prompt]);
      //     llmReply =
      //       gen?.generations?.[0]?.[0]?.text ??
      //       gen?.generations?.[0]?.[0]?.message?.content ??
      //       gen?.output?.[0]?.content?.[0]?.text ??
      //       JSON.stringify(gen);
      //   } else if (typeof (llm as any).call === "function") {
      //     // @ts-ignore
      //     llmReply = (await (llm as any).call(prompt)) ?? "";
      //   } else if (typeof (llm as any).invoke === "function") {
      //     // @ts-ignore
      //     llmReply = (await (llm as any).invoke(prompt)) ?? "";
      //   } else {
      //     throw new Error("no supported LLM call method available");
      //   }

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
