import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio");

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Convert to a File object Whisper can accept
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine extension from mime type
    const mimeType = audioFile.type || "audio/webm";
    const ext = mimeType.includes("mp4") ? "mp4"
      : mimeType.includes("ogg") ? "ogg"
      : mimeType.includes("wav") ? "wav"
      : "webm";

    const file = new File([buffer], `recording.${ext}`, { type: mimeType });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "en",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: error.message || "Transcription failed" },
      { status: 500 }
    );
  }
}
