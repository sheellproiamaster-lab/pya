import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
    });
return NextResponse.json({ url: response.data?.[0]?.url });
  } catch (error) {
    console.error("Erro ao gerar imagem:", error);
    return NextResponse.json({ error: "Erro ao gerar imagem" }, { status: 500 });
  }
}