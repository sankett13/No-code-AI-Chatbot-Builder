// src/app/api/bots/generate-instructions/route.ts
import { NextResponse } from "next/server";
import {
  GoogleGenerativeAIEmbeddings,
  ChatGoogleGenerativeAI,
} from "@langchain/google-genai";

export async function POST(req: Request) {
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0.7,
  });

  try {
    const body = await req.json();
    const {
      name,
      existingInstructions = "",
      tone = "friendly",
      length = "concise",
    } = body;

    // Validate session: read Authorization header and verify with Supabase if you want
    // (You already do similar session fetch in /api/bots in this repo)
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build prompt
    const prompt = `You are an assistant that writes concise "system instructions" for a chatbot.
Bot name: ${name}
Tone: ${tone}
Existing instructions: ${existingInstructions || "none"}

Write a short, clear system instruction (3-4 sentences) that defines the bot's role, tone, and what it should not do. Keep it ${length}. Output only the instruction. and avoid any additional commentary.`;

    // Option A: Directly use the model to generate instructions
    const response = await model.invoke(prompt);
    const instructionText = response.text;

    return NextResponse.json({ instructions: instructionText });
  } catch (error) {
    console.error("generate-instructions error", error);
    return NextResponse.json(
      { error: "Failed to generate instructions" },
      { status: 500 }
    );
  }
}
