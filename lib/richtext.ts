import DOMPurify from "isomorphic-dompurify";

// Rich text pipeline: the editor stores HTML; every render path sanitizes
// with a fixed allowlist so no script/style ever reaches the page.
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "blockquote",
  "hr",
  "a",
  "img",
  "figure",
  "figcaption",
  "h2",
  "h3",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "div",
  "iframe",
];
const ALLOWED_ATTR = [
  "href",
  "src",
  "alt",
  "target",
  "rel",
  "colspan",
  "rowspan",
  "width",
  "height",
  "allowfullscreen",
  "frameborder",
  "data-youtube-video",
];

// Iframes are only for video link embeds (PRD 7.2); any other src is removed.
const EMBED_HOSTS =
  /^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|player\.vimeo\.com)\//;

DOMPurify.addHook("uponSanitizeElement", (node, data) => {
  if (data.tagName !== "iframe") return;
  const src = (node as Element).getAttribute?.("src") ?? "";
  if (!EMBED_HOSTS.test(src)) {
    node.parentNode?.removeChild(node);
  }
});

export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}

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
