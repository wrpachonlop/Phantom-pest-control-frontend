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


// Definimos las transiciones permitidas según el prompt
export const COMMERCIAL_TRANSITIONS: Record<string, string[]> = {
  assigned:  ["approved", "pending", "cancelled"], // Desde assigned puede avanzar a propuesta aprobada, pendiente o cancelarse
  pending:   ["approved", "cancelled"],           // Desde pendiente va a approved o se cancela
  approved:  ["installed", "cancelled"],          // Desde aprobado el contrato pasa estrictamente a instalación o se cancela
  declined:  ["pending", "cancelled"],           // Si fue declinado, se puede renegociar (pending) o cancelar
  installed: [],                                  // Estado final operativo del flujo comercial actual
  cancelled: []                                   // Estado final de salida
};

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
  inspector_name: string | null;
}

export interface ClientFull extends Client {
  contact_method: ContactMethod | null;
  pest_issues: PestIssue[];
  phones: Phone[];
  emails: Email[];
  sold_by_user: User | null;
  created_by_user: User | null;
  details: CommercialClientDetails | null;

}

export interface CommercialClientDetails {
  id: string;
  client_id: string;
  workflow_status: string; // O el enum específico si lo tienes tipado
  lead_source: string;
  crew_member_id: string | null;
  inspector_id: string;
  company_name: string | null;
  contact_person_name: string | null;
  service_address: string | null;
  billing_address: string | null;
  billing_same_as_service: boolean;
  billing_terms: string | null;
  initial_setup_cost: number | null;
  recurring_service_cost: number | null;
  service_frequency: string | null;
  frequency_interval: number | null;
  phone_number: string | null;
  email: string | null;
  notes: string | null;
  proposal_drive_link: string | null;
  approved_by_name: string | null;
  approved_date: string | null; // ISOString o YYYY-MM-DD
  approved_by_user_id: string | null;
  next_followup_date: string | null;
  installation_date: string | null;
  installation_notes: string | null;
  cancelled_date: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
  inspector?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
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
