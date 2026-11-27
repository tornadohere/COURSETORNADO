export type UserRole = "user" | "admin";

export interface AdminProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface MemberProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  bio: string;
  specialty: string;
  is_active: boolean;
  is_muted: boolean;
  active_session_token?: string;
  created_at: string;
  updated_at?: string;
}

export type WaitlistStatus = "new" | "contacted" | "enrolled" | "archived";

export interface WaitlistEntry {
  id: string;
  name: string;
  phone: string;
  status: WaitlistStatus;
  notes: string;
  source: string;
  launch_date: string;
  created_at: string;
  updated_at: string;
}

export interface WaitlistStats {
  total: number;
  today: number;
  last7Days: number;
  newCount: number;
  contactedCount: number;
  enrolledCount: number;
  archivedCount: number;
}

export type LessonVideoType = "hls" | "mp4";

export interface CourseRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail_url: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  lessons?: LessonRecord[];
}

export interface LessonRecord {
  id: string;
  course_id: string;
  module_title: string;
  title: string;
  description: string;
  sort_order: number;
  duration_seconds: number;
  video_type: LessonVideoType;
  r2_key?: string;
  has_video?: boolean;
  has_hls_encryption?: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatChannelRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  is_readonly: boolean;
  sort_order: number;
  created_at: string;
}

export interface ChatMessageRecord {
  id: string;
  channel_id: string;
  user_id: string;
  author_name: string;
  author_role: UserRole;
  content: string;
  reply_to_id: string | null;
  reply_preview: string;
  created_at: string;
}

export type ExclusiveVaultType = "prompt" | "skill";
export type ExclusiveVaultCategory =
  | "coding"
  | "video"
  | "design"
  | "marketing"
  | "general";

export interface ExclusiveVaultItem {
  id: string;
  type: ExclusiveVaultType;
  category: ExclusiveVaultCategory;
  title: string;
  tag: string;
  description: string;
  how_to: string;
  file_name: string;
  install_cmd: string;
  content: string;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
