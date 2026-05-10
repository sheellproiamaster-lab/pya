import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        search_depth: "advanced",
        max_results: 5,
      }),
    });
    const data = await response.json();
    return NextResponse.json({ results: data.results });
  } catch (error) {
    console.error("Erro no Tavily:", error);
    return NextResponse.json({ error: "Erro na busca" }, { status: 500 });
  }
}