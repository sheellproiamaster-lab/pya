import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { id, email, name, avatar_url } = await req.json();
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  const { error } = await supabase
    .from("users")
    .upsert({ id, email, name, avatar_url, plan: "free" }, { onConflict: "id" });
  if (error) {
    console.error("POST user upsert error:", JSON.stringify(error));
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await req.json();
  await supabase.from("messages").delete().eq("user_id", userId);
  await supabase.from("conversations").delete().eq("user_id", userId);
  await supabase.from("usage_limits").delete().eq("user_id", userId);
  await supabase.from("subscriptions").delete().eq("user_id", userId);
  await supabase.from("generated_files").delete().eq("user_id", userId);
  await supabase.from("users").delete().eq("id", userId);
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ success: true });
}
