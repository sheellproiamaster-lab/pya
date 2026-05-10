import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim() === "") {
      return NextResponse.json({ error: "text obrigatório" }, { status: 400 });
    }
    const mp3 = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice: "sage",
      input: text,
    });
    const buffer = Buffer.from(await mp3.arrayBuffer());
    return new NextResponse(buffer, {
      headers: { "Content-Type": "audio/mpeg", "Content-Length": buffer.length.toString() },
    });
  } catch (error) {
    console.error("Erro no TTS:", error);
    return NextResponse.json({ error: "Erro ao gerar áudio" }, { status: 500 });
  }
}