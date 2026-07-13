import { listFeedComments } from "@/lib/data/feed";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!UUID.test(id)) {
    return Response.json({ comments: [] }, { status: 400 });
  }

  const comments = await listFeedComments(id);
  return Response.json(
    { comments },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
