import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

// Available interviewer voice personas
const VALID_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    const { text, voice = "onyx", speed = 1.0 } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const selectedVoice = VALID_VOICES.includes(voice) ? voice : "onyx";

    // Cap text length to avoid excessive costs (≈ 3 minutes of speech)
    const cappedText = text.slice(0, 4000);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const mp3Response = await openai.audio.speech.create({
      model: "tts-1",
      voice: selectedVoice,
      input: cappedText,
      speed: Math.min(Math.max(speed, 0.25), 4.0), // clamp to valid range
    });

    const buffer = Buffer.from(await mp3Response.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: error.message || "Speech synthesis failed" },
      { status: 500 }
    );
  }
}
