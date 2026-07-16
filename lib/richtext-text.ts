// Lightweight rich-text helpers for cards, metadata and search snippets.
// Keep this module DOM-free so list pages do not load jsdom at runtime.

// Legacy posts are plain text; new posts start with an HTML tag.
export function isRichText(body: string): boolean {
  return body.trimStart().startsWith("<");
}

// For teasers, meta descriptions and search snippets.
export function stripRichText(body: string): string {
  if (!isRichText(body)) return body;
  return body
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
