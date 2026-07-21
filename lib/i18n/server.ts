import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from "@/lib/constants";
import { getDictionary, isLocale, type Dictionary } from "@/lib/i18n";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const cookieValue = store.get(LOCALE_COOKIE)?.value;
  // An explicit choice from the language switcher always wins.
  if (isLocale(cookieValue)) return cookieValue;
  // First visit / no choice yet: honor the browser's Accept-Language so a
  // Korean visitor lands on Korean without having to switch manually.
  const acceptLanguage = (await headers()).get("accept-language") ?? "";
  return detectLocaleFromHeader(acceptLanguage);
}

// Highest-priority Accept-Language tag we ship (e.g. "ko-KR" -> "ko"),
// respecting q-weights; DEFAULT_LOCALE when the browser asks for nothing we have.
function detectLocaleFromHeader(acceptLanguage: string): Locale {
  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";q=");
      const q = qPart ? Number.parseFloat(qPart) : 1;
      return {
        base: tag.toLowerCase().split("-")[0],
        q: Number.isFinite(q) ? q : 0,
      };
    })
    .sort((a, b) => b.q - a.q);
  for (const { base } of ranked) {
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

export async function getT(): Promise<{ t: Dictionary; locale: Locale }> {
  const locale = await getLocale();
  return { t: getDictionary(locale), locale };
}
