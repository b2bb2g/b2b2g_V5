import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { STORAGE_BUCKETS } from "@/lib/constants";

// RLS decides download scope: members can read attachments on readable posts,
// while anonymous visitors can read only approved notice attachments.
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const { data: attachment } = await supabase
    .from("post_attachments")
    .select("path, filename")
    .eq("id", id)
    .maybeSingle();
  if (!attachment) return new Response(null, { status: 404 });

  const { data: signed } = await supabase.storage
    .from(STORAGE_BUCKETS.ATTACHMENTS)
    .createSignedUrl(attachment.path, 60 * 10, {
      download: attachment.filename,
    });
  if (!signed) return new Response(null, { status: 404 });

  redirect(signed.signedUrl);
}
