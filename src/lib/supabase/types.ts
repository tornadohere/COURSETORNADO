export type UserRole = "user" | "admin";

export interface AdminProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
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
