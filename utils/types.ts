// =============================================================
// Phantom Pest Control CRM – Frontend Types
// =============================================================

export type ClientType = "new" | "existing" | "recurrent" | "spam";
export type PropertyType = "residential" | "commercial";
export type ClientStatus = "blue" | "white" | "yellow" | "purple" | "green" | "red";
export type CommercialStatus = "assigned" | "pending" | "approved" | "declined" | "installed" | "cancelled";
export type LocationType = "address" | "city";
export type FollowUpType = "inbound" | "outbound" | "sold";
export type AuditAction = "create" | "update" | "delete";
export type UserRole = "admin" | "user" | "crew";

// ── Status display helpers ──────────────────────────────────

export const COMMERCIAL_STATUS_LABELS: Record<string, string> = {
  assigned: "Assigned",
  pending: "Pending",
  approved: "Approved",
  declined: "Declined",
  installed: "Installed",
  cancelled: "Cancelled"
};

export const COMMERCIAL_STATUS_COLORS: Record<string, string> = {
  assigned: "bg-blue-50 text-blue-700 border-blue-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  declined: "bg-red-50 text-red-700 border-red-200",
  installed: "bg-teal-50 text-teal-700 border-teal-200",
  cancelled: "bg-gray-50 text-gray-700 border-gray-200",
}; 

export const STATUS_LABELS: Record<ClientStatus, string> = {
  blue:   "Initial",
  white:  "Contacted",
  yellow: "In Progress",
  purple: "Potential",
  green:  "Sold",
  red:    "Not Sold",
};


export const STATUS_COLORS: Record<ClientStatus, string> = {
  blue:   "bg-blue-100   text-blue-800   border-blue-300",
  white:  "bg-slate-100  text-slate-700  border-slate-300",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
  purple: "bg-purple-100 text-purple-800 border-purple-300",
  green:  "bg-green-100  text-green-800  border-green-300",
  red:    "bg-red-100    text-red-800    border-red-300",
};

export const STATUS_DOT: Record<ClientStatus, string> = {
  blue:   "bg-blue-500",
  white:  "bg-slate-400",
  yellow: "bg-yellow-500",
  purple: "bg-purple-500",
  green:  "bg-green-500",
  red:    "bg-red-500",
};

// ── Entities ────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  is_inspector: boolean;
}

export interface ContactMethod {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface PestIssue {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Phone {
  id: string;
  client_id: string;
  phone_number: string;
  label: string;
  created_at: string;
}

export interface Email {
  id: string;
  client_id: string;
  email: string;
  label: string;
  created_at: string;
}

export interface Client {
  id: string;
  client_name: string | null;
  client_type: ClientType;
  property_type: PropertyType;
  status: ClientStatus;
  client_contact_date: string;
  first_contact_date: string | null;
  sold_date: string | null;
  after_hours: boolean;
  contact_method_id: string;
  problem_description: string | null;
  location_type: LocationType;
  location_value: string | null;
  sold_by: string | null;
  sale_range: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  inspector_id: string | null;
  workflow_status: string | null;
}

export interface ClientFull extends Client {
  contact_method: ContactMethod | null;
  pest_issues: PestIssue[];
  phones: Phone[];
  emails: Email[];
  sold_by_user: User | null;
  created_by_user: User | null;
}

export interface FollowUp {
  id: string;
  client_id: string;
  date: string;
  type: FollowUpType;
  description: string | null;
  created_by: string;
  created_at: string;
  created_by_user?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export interface Note {
  id: string;
  client_id: string;
  user_id: string;
  note: string;
  created_at: string;
  user_full_name?: string | null;
  user_email?: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_full_name?: string | null;
  user_email?: string | null;
}

// ── Report Types ────────────────────────────────────────────

export interface ContactMethodBreakdown {
  contact_method_id: string;
  contact_method_name: string;
  received: number;
  sold: number;
  conversion_rate: number;
}

export interface ResidentialReportSection {
  by_contact_method: ContactMethodBreakdown[];
  total_received: number;
  total_sold: number;
  conversion_rate: number;
}

export interface CommercialReportSection {
  total_received: number;
  total_sold: number;
  conversion_rate: number;
}

export interface AfterHoursSection {
  total_received: number;
  total_sold: number;
  conversion_rate: number;
}

export interface ReportTotals {
  total_received: number;
  total_sold: number;
  conversion_rate: number;
}

export interface ReportPeriodResult {
  period_label: string;
  date_from: string;
  date_to: string;
  residential: ResidentialReportSection;
  commercial: CommercialReportSection;
  after_hours: AfterHoursSection;
  totals: ReportTotals;
}

export interface PeriodSummaryPoint {
  label: string;
  from: string;
  to: string;
  total_received: number;
  total_sold: number;
  conversion_rate: number;
}

export interface PerformerRow {
  user_id: string;
  full_name: string | null;
  email: string;
  total_sales: number;
  residential_sales: number;
  commercial_sales: number;
}

export interface DashboardResponse {
  status_distribution: Record<ClientStatus, number>;
  weekly_trend: PeriodSummaryPoint[];
  top_performers: PerformerRow[];
  today_stats: ReportPeriodResult;
  this_week_stats: ReportPeriodResult;
  this_month_stats: ReportPeriodResult;
}

// ── API ─────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DuplicateCheckResult {
  found: boolean;
  clients: Client[];
  match_on: "phone" | "email" | "both" | "";
}

// ── Form request shapes ──────────────────────────────────────

export interface CreateClientForm {
  client_name?: string;
  client_type: ClientType;
  property_type: PropertyType;
  status?: ClientStatus;
  client_contact_date: string;
  after_hours: boolean;
  contact_method_id: string;
  problem_description?: string;
  location_type: LocationType;
  location_value?: string;
  sale_range?: string;
  sold_date?: string;
  phones: { phone_number: string; label?: string }[];
  emails: { email: string; label?: string }[];
  pest_issues: string[];
}

export interface CreateFollowUpForm {
  client_id: string;
  date: string;
  type: FollowUpType;
  description?: string;
}
