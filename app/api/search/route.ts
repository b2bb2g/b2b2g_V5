import { NextRequest, NextResponse } from "next/server";
import { searchPublicPosts } from "@/lib/data/public-search";
import { normalizeSearchScope, SEARCH_PAGE_SIZE } from "@/lib/search";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q") ?? "";
  const page = Math.max(
    1,
    Number.parseInt(searchParams.get("page") ?? "1", 10) || 1,
  );
  const scope = normalizeSearchScope(searchParams.get("type") ?? undefined);

  try {
    const result = await searchPublicPosts({
      query,
      page,
      pageSize: SEARCH_PAGE_SIZE,
      scope,
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "search_unavailable" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
