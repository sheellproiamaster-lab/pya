import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { audio } = await req.json();
    if (!audio || typeof audio !== "string") {
      return NextResponse.json({ error: "audio obrigatório (base64)" }, { status: 400 });
    }
    const buffer = Buffer.from(audio, "base64");
    const blob = new Blob([buffer], { type: "audio/webm" });
    const file = new File([blob], "audio.webm", { type: "audio/webm" });
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "pt",
    });
    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    console.error("Erro no STT:", error);
    return NextResponse.json({ error: "Erro ao transcrever áudio" }, { status: 500 });
  }
}