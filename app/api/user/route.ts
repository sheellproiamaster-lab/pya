import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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