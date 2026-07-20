export const SEARCH_PAGE_SIZE = 12;
export const SEARCH_MAX_QUERY_LENGTH = 80;
export const SEARCH_MIN_QUERY_LENGTH = 2;

export type SearchScope = "all" | "product" | "request";
export type SearchSort = "latest" | "popular";

export function normalizeSearchSort(value: string | undefined): SearchSort {
  return value === "popular" ? "popular" : "latest";
}

export function sanitizeSearchQuery(value: string): string {
  return value
    .trim()
    .slice(0, SEARCH_MAX_QUERY_LENGTH)
    .replace(/[,()%\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeSearchScope(value: string | undefined): SearchScope {
  return value === "product" || value === "request" ? value : "all";
}
