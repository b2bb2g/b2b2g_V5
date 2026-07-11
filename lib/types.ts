import type {
  BoardType,
  InquiryStatus,
  MemberStatus,
  MessageReviewStatus,
  NotificationState,
  PostStatus,
} from "@/lib/constants";

export type Menu = {
  id: string;
  slug: string;
  title_en: string;
  title_ko: string;
  board_type: BoardType;
  sort_order: number;
  is_visible: boolean;
  member_write: boolean;
  review_required: boolean;
};

export type Profile = {
  id: string;
  uid: number;
  display_name: string | null;
  company_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  status: MemberStatus;
  is_admin: boolean;
  is_coordinator: boolean;
  referred_by: string | null;
  last_seen_at: string | null;
  created_at: string;
};

export type BadgeType = {
  id: string;
  code: string;
  name_en: string;
  name_ko: string;
  is_active: boolean;
};

export type MemberBadge = {
  badge_type_id: string;
  badge_types: BadgeType | null;
};

export type PostTeaser = {
  id: string;
  menu_id: string;
  type: BoardType;
  status: PostStatus;
  title_en: string;
  title_ko: string | null;
  body_teaser_en: string;
  body_teaser_ko: string | null;
  body_truncated: boolean;
  rep_image_path: string | null;
  rep_video_url: string | null;
  deadline: string | null;
  closed_at: string | null;
  published_at: string | null;
  created_at: string;
  author_uid: number;
  author_name: string | null;
  author_company: string | null;
};

export type Post = {
  id: string;
  menu_id: string;
  author_id: string;
  type: BoardType;
  status: PostStatus;
  title_en: string;
  title_ko: string | null;
  body_en: string;
  body_ko: string | null;
  category_id: string | null;
  rep_image_path: string | null;
  rep_video_url: string | null;
  deadline: string | null;
  closed_at: string | null;
  reject_reason: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PostSpec = {
  id: string;
  post_id: string;
  field_def_id: string | null;
  name_en: string;
  name_ko: string | null;
  value: string;
  sort_order: number;
};

export type Inquiry = {
  id: string;
  post_id: string | null;
  sender_id: string;
  recipient_id: string;
  subject: string;
  status: InquiryStatus;
  is_service_inquiry: boolean;
  created_at: string;
  updated_at: string;
};

export type InquiryMessage = {
  id: string;
  inquiry_id: string;
  sender_id: string;
  body: string;
  review_status: MessageReviewStatus;
  reject_reason: string | null;
  admin_feedback: string | null;
  created_at: string;
};

export type AppNotification = {
  id: string;
  profile_id: string;
  type: string;
  payload: Record<string, unknown>;
  state: NotificationState;
  created_at: string;
};

export type SpecFieldDef = {
  id: string;
  name_en: string;
  name_ko: string;
  sort_order: number;
  is_active: boolean;
};
