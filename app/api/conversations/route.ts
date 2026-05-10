import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ conversations: data });
}

export async function POST(req: NextRequest) {
  const { userId, title } = await req.json();
  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: userId, title: title || "Nova conversa", favorited: false })
    .select()
    .single();
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ conversation: data });
}

export async function PATCH(req: NextRequest) {
  const { id, title, favorited } = await req.json();
  const updates: { title?: string; favorited?: boolean; updated_at: string } = { updated_at: new Date().toISOString() };
  if (title !== undefined) updates.title = title;
  if (favorited !== undefined) updates.favorited = favorited;
  const { data, error } = await supabase.from("conversations").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ conversation: data });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const { error } = await supabase.from("conversations").delete().eq("id", id);
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ success: true });
}