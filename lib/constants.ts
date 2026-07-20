// Central constants module. Policy values live in the site_settings table
// (admin-controlled switches); only structural enums belong here.

export const BOARD_TYPES = {
  PRODUCT: "product",
  REQUEST: "request",
  FLEXIBLE: "flexible",
  NOTICE: "notice",
} as const;
export type BoardType = (typeof BOARD_TYPES)[keyof typeof BOARD_TYPES];

export const POST_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CLOSED: "closed",
} as const;
export type PostStatus = (typeof POST_STATUS)[keyof typeof POST_STATUS];

// Slugs of the two utility menus that carry nav badges. Their routes are fixed
// (/notices board, /faq guide page), so these slugs are effectively stable.
export const MENU_SLUGS = {
  NOTICES: "notices",
  FAQ: "faq",
} as const;

export const INQUIRY_STATUS = {
  SENT: "sent",
  ADMIN_REVIEW: "admin_review",
  FORWARDED: "forwarded",
  ANSWERED: "answered",
  ANSWER_REVIEW: "answer_review",
  ANSWER_DELIVERED: "answer_delivered",
  REJECTED: "rejected",
} as const;
export type InquiryStatus = (typeof INQUIRY_STATUS)[keyof typeof INQUIRY_STATUS];

export const MESSAGE_REVIEW_STATUS = {
  PENDING: "pending",
  FORWARDED: "forwarded",
  REJECTED: "rejected",
} as const;
export type MessageReviewStatus =
  (typeof MESSAGE_REVIEW_STATUS)[keyof typeof MESSAGE_REVIEW_STATUS];

export const MEMBER_STATUS = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
  WITHDRAWN: "withdrawn",
} as const;
export type MemberStatus = (typeof MEMBER_STATUS)[keyof typeof MEMBER_STATUS];

export const SUBSCRIPTION_STATUS = {
  ACTIVE: "active",
  EXPIRED: "expired",
  REVOKED: "revoked",
} as const;
export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

export const BADGE_APPLICATION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;
export type BadgeApplicationStatus =
  (typeof BADGE_APPLICATION_STATUS)[keyof typeof BADGE_APPLICATION_STATUS];

export const NOTIFICATION_STATE = {
  UNREAD: "unread",
  READ: "read",
  ARCHIVED: "archived",
  TRASHED: "trashed",
} as const;
export type NotificationState =
  (typeof NOTIFICATION_STATE)[keyof typeof NOTIFICATION_STATE];

// Keys of admin-controlled switches stored in site_settings.
export const SETTING_KEYS = {
  SITE_TITLE: "site_title",
  SITE_DESCRIPTION: "site_description",
  SITE_OG_IMAGE: "site_og_image",
  FREE_POST_LIMIT: "free_post_limit",
  FEATURED_SLOTS: "featured_slots",
  CATEGORY_NAV_VISIBLE: "category_nav_visible",
  TRANSLATION_ASSIST_VISIBLE: "translation_assist_visible",
  VIDEO_AUTOPLAY: "video_autoplay",
  REFERRAL_STATS_VISIBLE: "referral_stats_visible",
  COORDINATOR_MESSAGE_ACCESS: "coordinator_message_access_global",
  PWA_BANNER_ENABLED: "pwa_banner_enabled",
  PWA_BANNER_REDISPLAY_DAYS: "pwa_banner_redisplay_days",
  INAPP_REDIRECT_ENABLED: "inapp_redirect_enabled",
  UPLOAD_MAX_FILE_MB: "upload_max_file_mb",
  UPLOAD_MAX_FILES_PER_POST: "upload_max_files_per_post",
  SUBSCRIPTION_EXPIRY_NOTICE_DAYS: "subscription_expiry_notice_days",
  SEO_INDEX_ENABLED: "seo_index_enabled",
  SEARCH_POPULAR_EN: "search_popular_en",
  SEARCH_POPULAR_KO: "search_popular_ko",
  ROBOTS_EXTRA_DISALLOW: "robots_extra_disallow",
  GOOGLE_SITE_VERIFICATION: "google_site_verification",
  NAVER_SITE_VERIFICATION: "naver_site_verification",
  INAPP_REDIRECT_PATHS: "inapp_redirect_paths",
  SIGNUP_MODE: "signup_mode",
  REFERRAL_INVITE_EXPIRY_DAYS: "referral_invite_expiry_days",
  REFERRAL_INVITE_MAX_ACTIVE: "referral_invite_max_active",
  LOGIN_SESSION_POLICY: "login_session_policy",
  NEW_DEVICE_EMAIL_ALERT: "new_device_email_alert",
  SUSPICIOUS_LOGIN_EMAIL_ALERT: "suspicious_login_email_alert",
  ADMIN_QUEUE_SLA_HOURS: "admin_queue_sla_hours",
  COOKIE_BANNER_TEXT_EN: "cookie_banner_text_en",
  COOKIE_BANNER_TEXT_KO: "cookie_banner_text_ko",
} as const;
export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

// Permission actions used in the tier x action permission matrix.
export const PERMISSION_ACTIONS = {
  CREATE_POST: "create_post",
  SEND_INQUIRY: "send_inquiry",
} as const;
export type PermissionAction =
  (typeof PERMISSION_ACTIONS)[keyof typeof PERMISSION_ACTIONS];

// Built-in badge codes (badge types are dynamic; these are the seeded ones).
export const COOKIE_CONSENT_KEY = "cookie-consent";

export const BADGE_CODES = {
  MANUFACTURER: "manufacturer",
  CERTIFIED: "certified",
} as const;

// Built-in tier codes (tiers are dynamic; these are the seeded ones).
export const TIER_CODES = {
  GENERAL: "general",
  CERTIFIED: "certified",
} as const;

export const LOCALES = ["en", "ko"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "locale";
// Language autonyms (each language's own name -- data, not translatable copy).
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ko: "한국어",
};

// Set when a recovery link signs the user in; cleared once a new password is
// saved. While present, proxy.ts locks navigation to the reset screen.
export const PW_RESET_COOKIE = "pw-reset-required";

// Present when the member unchecked "keep me signed in": auth cookies are
// then written without persistence so the login ends with the browser session.
export const SESSION_ONLY_COOKIE = "session-only";

// Random browser identifier used only as a hash when recognizing a member's
// own devices. The raw value never leaves the encrypted HTTP-only cookie.
export const TRUSTED_DEVICE_COOKIE = "trusted-device";
export const PENDING_VERIFY_EMAIL_COOKIE = "pending-verify-email";

export const STORAGE_BUCKETS = {
  POST_MEDIA: "post-media",
  ATTACHMENTS: "attachments",
  BADGE_DOCS: "badge-docs",
  SITE_ASSETS: "site-assets",
} as const;

// Number of characters of the body exposed to non-members (teaser).
// Mirrored in the DB view public_posts; keep in sync with the migration.
export const TEASER_LENGTH = 600;
