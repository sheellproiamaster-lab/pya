import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const conversationId = req.nextUrl.searchParams.get("conversationId");
  if (!conversationId) return NextResponse.json({ error: "conversationId obrigatório" }, { status: 400 });
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("GET messages error:", JSON.stringify(error));
    return NextResponse.json({ error: error.message, details: error }, { status: 500 });
  }
  return NextResponse.json({ messages: data });
}

export async function POST(req: NextRequest) {
  let body: { conversationId?: string; userId?: string; role?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }
  const { conversationId, userId, role, content } = body;
  if (!conversationId) return NextResponse.json({ error: "conversationId obrigatório" }, { status: 400 });
  if (!role) return NextResponse.json({ error: "role obrigatório" }, { status: 400 });
  if (!content) return NextResponse.json({ error: "content obrigatório" }, { status: 400 });
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, user_id: userId, role, content, created_at: now })
    .select()
    .single();
  if (error) {
    console.error("POST messages error:", JSON.stringify(error));
    return NextResponse.json({ error: error.message, details: error }, { status: 500 });
  }
  await supabase.from("conversations").update({ updated_at: now }).eq("id", conversationId);
  return NextResponse.json({ message: data });
}
