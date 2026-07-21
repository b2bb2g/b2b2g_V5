// Single source of truth for the landing-page fields an admin can override.
// Each field maps to a `t.home.<key>` i18n default and a role (for the editor
// label). Used by: the admin editor (renders sections/fields), the seed
// migration (key list), and — indirectly — the landing reads in app/page.tsx.
//
// The stored setting key for each field is `landing_<key>_<ko|en>`; the landing
// reads `settingString(settings, key) || t.home[field]`, so an unset or blank
// override falls back to the i18n default.

export type LandingRole =
  | "eyebrow"
  | "title"
  | "subtitle"
  | "body"
  | "tagline"
  | "button";

export type LandingField = { key: string; role: LandingRole };
export type LandingSectionId =
  | "hero"
  | "newProducts"
  | "howItWorks"
  | "requests"
  | "showcase"
  | "feed"
  | "rails"
  | "finalCta";

export type LandingSection = {
  id: LandingSectionId;
  // Optional sub-group headings for repeated items (values, steps, rails).
  groups?: { label: string; fieldKeys: string[] }[];
  fields: LandingField[];
};

export const LANDING_SECTIONS: LandingSection[] = [
  {
    id: "hero",
    fields: [
      { key: "eyebrow", role: "eyebrow" },
      { key: "heroTitle", role: "title" },
      { key: "heroSubtitle", role: "subtitle" },
      { key: "browseBoards", role: "button" },
      { key: "browseRequests", role: "button" },
    ],
  },
  {
    id: "newProducts",
    fields: [
      { key: "eyebrowBrowse", role: "eyebrow" },
      { key: "newProducts", role: "title" },
      { key: "newProductsBody", role: "body" },
    ],
  },
  {
    id: "howItWorks",
    fields: [
      { key: "howItWorksTitle", role: "eyebrow" },
      { key: "valueTitle", role: "title" },
      { key: "value1Title", role: "title" },
      { key: "value1Body", role: "body" },
      { key: "value2Title", role: "title" },
      { key: "value2Body", role: "body" },
      { key: "value3Title", role: "title" },
      { key: "value3Body", role: "body" },
      { key: "step1Title", role: "title" },
      { key: "step1Body", role: "body" },
      { key: "step2Title", role: "title" },
      { key: "step2Body", role: "body" },
      { key: "step3Title", role: "title" },
      { key: "step3Body", role: "body" },
    ],
  },
  {
    id: "requests",
    fields: [
      { key: "eyebrowRequests", role: "eyebrow" },
      { key: "latestRequests", role: "title" },
    ],
  },
  {
    id: "showcase",
    fields: [
      { key: "eyebrowShowcase", role: "eyebrow" },
      { key: "featured", role: "title" },
      { key: "promoBody", role: "body" },
      { key: "eventsTitle", role: "title" },
    ],
  },
  {
    id: "feed",
    fields: [
      { key: "feedTitle", role: "title" },
      { key: "feedBody", role: "body" },
    ],
  },
  {
    id: "rails",
    fields: [
      { key: "commercialRailTagline", role: "tagline" },
      { key: "commercialRailTitle", role: "title" },
      { key: "commercialRailBody", role: "body" },
      { key: "industrialRailTagline", role: "tagline" },
      { key: "industrialRailTitle", role: "title" },
      { key: "industrialRailBody", role: "body" },
      { key: "epcRailTagline", role: "tagline" },
      { key: "epcRailTitle", role: "title" },
      { key: "epcRailBody", role: "body" },
    ],
  },
  {
    id: "finalCta",
    fields: [
      { key: "finalCtaTitle", role: "title" },
      { key: "finalCtaBody", role: "body" },
    ],
  },
];

// The hero background image is stored as a single public URL (not per-locale).
export const LANDING_HERO_IMAGE_KEY = "landing_hero_image";

// Every t.home field key that is overridable (for the seed migration / audits).
export const LANDING_FIELD_KEYS: string[] = LANDING_SECTIONS.flatMap((section) =>
  section.fields.map((field) => field.key),
);
