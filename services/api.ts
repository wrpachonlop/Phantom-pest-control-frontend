// =============================================================
// Phantom CRM – API client
// All requests go through this module.
// The Supabase access_token is injected automatically.
// =============================================================

import axios, { AxiosInstance } from "axios";
import { createBrowserClient } from "@/services/supabaseClient";import type {
  Client,
  ClientFull,
  CreateClientForm,
  PaginatedResponse,
  DuplicateCheckResult,
  FollowUp,
  CreateFollowUpForm,
  Note,
  AuditLog,
  ContactMethod,
  PestIssue,
  User,
  ReportPeriodResult,
  DashboardResponse,
} from "@/utils/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

// ── Axios instance ────────────────────────────────────────

const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Inject fresh JWT before every request
http.interceptors.request.use(async (config) => {
  const supabase = createBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// ── Client API ────────────────────────────────────────────

export interface ClientListParams {
  page?: number;
  page_size?: number;
  status?: string;
  property_type?: string;
  after_hours?: boolean;
  search?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export const clientsApi = {
  list: (params: ClientListParams = {}) =>
    http.get<PaginatedResponse<Client>>("/clients", { params }).then((r) => r.data),

  get: (id: string) =>
    http.get<ClientFull>(`/clients/${id}`).then((r) => r.data),

  create: (data: CreateClientForm) =>
    http.post<ClientFull>("/clients", data).then((r) => r.data),

  update: (id: string, data: Partial<CreateClientForm>) =>
    http.put<Client>(`/clients/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    http.delete(`/clients/${id}`).then((r) => r.data),

  checkDuplicates: (phones: string[], emails: string[]) =>
    http.post<DuplicateCheckResult>("/clients/check-duplicates", { phones, emails })
      .then((r) => r.data),

  getAuditLog: (id: string) =>
    http.get<{ data: AuditLog[] }>(`/clients/${id}/audit`).then((r) => r.data.data),
};

// ── Follow-ups API ────────────────────────────────────────

export const followUpsApi = {
  getByClient: (clientId: string) =>
    http.get<{ data: FollowUp[] }>(`/clients/${clientId}/follow-ups`)
      .then((r) => r.data.data),

  create: (data: CreateFollowUpForm) =>
    http.post<FollowUp>("/follow-ups", data).then((r) => r.data),

  delete: (id: string) =>
    http.delete(`/follow-ups/${id}`).then((r) => r.data),

  update: (id: string, data: any) => 
    http.put<FollowUp>(`/follow-ups/${id}`, data).then((r) => r.data),
};

// ── Notes API ─────────────────────────────────────────────

export const notesApi = {
  getByClient: (clientId: string) =>
    http.get<{ data: Note[] }>(`/clients/${clientId}/notes`).then((r) => r.data.data),

  create: (clientId: string, note: string) =>
    http.post<Note>("/notes", { client_id: clientId, note }).then((r) => r.data),

  delete: (id: string) =>
    http.delete(`/notes/${id}`).then((r) => r.data),
};

// ── Lookup tables API ─────────────────────────────────────

export const contactMethodsApi = {
  list: () =>
    http.get<{ data: ContactMethod[] }>("/contact-methods").then((r) => r.data.data),

  create: (name: string) =>
    http.post<ContactMethod>("/contact-methods", { name }).then((r) => r.data),

  update: (id: string, data: { name?: string; is_active?: boolean }) =>
    http.put<ContactMethod>(`/contact-methods/${id}`, data).then((r) => r.data),
};

export const pestIssuesApi = {
  list: () =>
    http.get<{ data: PestIssue[] }>("/pest-issues").then((r) => r.data.data),

  create: (name: string) =>
    http.post<PestIssue>("/pest-issues", { name }).then((r) => r.data),

  update: (id: string, data: { name?: string; is_active?: boolean }) =>
    http.put<PestIssue>(`/pest-issues/${id}`, data).then((r) => r.data),
};

// ── Reports API ───────────────────────────────────────────

export interface ReportParams {
  period: "daily" | "weekly" | "monthly" | "custom";
  anchor_date?: string;
  date_from?: string;
  date_to?: string;
}

export const reportsApi = {
  get: (params: ReportParams) =>
    http.get<ReportPeriodResult>("/reports", { params }).then((r) => r.data),

  getDashboard: (anchorDate?: string) =>
    http.get<DashboardResponse>("/reports/dashboard", { params: { anchor_date: anchorDate } }).then((r) => r.data),
};

// ── Users API ─────────────────────────────────────────────

export const usersApi = {
  me: () =>
    http.get<User>("/me").then((r) => r.data),

  syncMe: (data: { full_name?: string; avatar_url?: string }) =>
    http.post<User>("/me/sync", data).then((r) => r.data),

  list: () =>
    http.get<{ data: User[] }>("/admin/users").then((r) => r.data.data),

  updateRole: (id: string, role: "admin" | "user") =>
    http.put(`/admin/users/${id}/role`, { role }).then((r) => r.data),
};

// ── Audit logs API ────────────────────────────────────────

export const auditLogsApi = {
  list: (params?: { entity_type?: string; entity_id?: string }) =>
    http.get<{ data: AuditLog[] }>("/audit-logs", { params }).then((r) => r.data.data),
};

// ── Crew Members API ──────────────────────────────────────

export interface CrewMember {
  id: string;
  full_name: string;
  employee_id?: string;
  is_active: boolean;
  created_at: string;
}

export const crewMembersApi = {
  list: () =>
    http.get<{ data: CrewMember[] }>("/crew-members").then((r) => r.data.data),

  create: (data: { full_name: string; employee_id?: string }) =>
    http.post<CrewMember>("/crew-members", data).then((r) => r.data),

  update: (id: string, data: { full_name?: string; is_active?: boolean }) =>
    http.put<CrewMember>(`/crew-members/${id}`, data).then((r) => r.data),
};

// ── Commercial & Inspectors API ───────────────────────────

export const commercialApi = {
  // Lista usuarios con flag is_inspector = true
  listInspectors: () =>
    http.get<{ data: User[] }>("/inspectors").then((r) => r.data.data),

  // Activa/Desactiva el flag de inspector en un usuario (Admin only)
  setInspectorFlag: (userId: string, isInspector: boolean) =>
    http.put(`/admin/users/${userId}/inspector`, { is_inspector: isInspector }).then((r) => r.data),
    
  // Endpoint para crear inspector externo (el que no tiene login)
  createExternalInspector: (data: { full_name: string; email: string }) =>
    http.post("/admin/inspectors", data).then((r) => r.data),
};

// ── Locations API ─────────────────────────────────────────

export interface ClientLocation {
  id: string;
  client_id: string;
  label: string;
  location_type: 'address' | 'coordinates';
  location_value: string;
  is_primary: boolean;
}

export const locationsApi = {
  listByClient: (clientId: string) =>
    http.get<ClientLocation[]>(`/clients/${clientId}/locations`).then((r) => r.data),

  create: (clientId: string, data: Omit<ClientLocation, "id" | "client_id">) =>
    http.post(`/clients/${clientId}/locations`, data).then((r) => r.data),

  update: (id: string, data: Partial<ClientLocation>) =>
    http.put(`/locations/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    http.delete(`/locations/${id}`).then((r) => r.data),
};
