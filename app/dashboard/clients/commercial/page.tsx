"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { clientsApi, contactMethodsApi, ClientListParams, usersApi } from "@/services/api";
import type { Client, ClientStatus, PaginatedResponse, ContactMethod, User } from "@/utils/types";
import { STATUS_LABELS, STATUS_COLORS, STATUS_DOT } from "@/utils/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  Search, Plus, ChevronLeft, ChevronRight,
  ArrowUpDown, Clock, Building2, User as UserIcon, Activity
} from "lucide-react";
import { formatDateOnly } from "@/src/lib/utils";

const PAGE_SIZE = 50;

export default function CommercialClientsPage() {
  const router = useRouter();
  
  // Forzamos property_type: "commercial" en el estado inicial
  const [params, setParams] = useState<ClientListParams>({
    page: 1, 
    page_size: PAGE_SIZE,
    sort_by: "created_at", 
    sort_dir: "desc",
    property_type: "commercial" // <--- Filtro base
  });
  
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<PaginatedResponse<Client>>({
    queryKey: ["clients", "commercial", params],
    queryFn: () => clientsApi.list(params),
    placeholderData: (prev) => prev,
    staleTime: 0,
  });

  // Necesitaremos los nombres de los inspectores (users) para mostrarlos en la tabla
  const { data: users } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: usersApi.list,
  });

  const { data: contactMethods } = useQuery<ContactMethod[]>({
    queryKey: ["contact-methods"],
    queryFn: contactMethodsApi.list,
  });

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    setParams((p) => ({ ...p, search: val || undefined, page: 1 }));
  }, []);

  const handleStatusFilter = (status?: ClientStatus) => {
    setParams((p) => ({ ...p, status, page: 1 }));
  };

  const handleSort = (field: string) => {
    setParams((p) => ({
      ...p,
      sort_by: field,
      sort_dir: p.sort_by === field && p.sort_dir === "asc" ? "desc" : "asc",
    }));
  };

  const clients = data?.data || [];
  const total = data?.total || 0;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-3 flex-wrap gap-y-2">
        <div className="flex items-center gap-2 mr-2">
            <Building2 className="h-5 w-5 text-amber-600" />
            <h1 className="text-base font-semibold text-gray-900">Commercial Clients</h1>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            className="input-base pl-9 py-1.5 text-xs"
            placeholder="Search company, contact..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {([undefined, "blue", "white", "yellow", "purple", "green", "red"] as (ClientStatus | undefined)[]).map((s) => (
            <button
              key={s ?? "all"}
              onClick={() => handleStatusFilter(s)}
              className={clsx(
                "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border",
                params.status === s
                  ? s ? STATUS_COLORS[s] : "bg-amber-600 text-white border-amber-600"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              )}
            >
              {s ? STATUS_LABELS[s] : "All"}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-500">{total} companies</span>
          <Link href="/dashboard/clients/new" className="btn-primary py-1.5 text-xs bg-amber-600 hover:bg-amber-700 border-amber-700">
            <Plus className="h-3.5 w-3.5" /> New Commercial
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="data-table w-full">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="w-8">#</th>
              <SortTh label="Company Name" field="client_name" params={params} onSort={handleSort} />
              <th>Inspector</th>
              <th>Workflow</th>
              <SortTh label="Status" field="status" params={params} onSort={handleSort} />
              <th>Contact Method</th>
              <th>Location</th>
              <SortTh label="Contact Date" field="client_contact_date" params={params} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="inline-block animate-spin h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full" />
                </td>
              </tr>
            )}
            {clients.map((client, i) => {
              const cm = contactMethods?.find((m) => m.id === client.contact_method_id);
              // Buscamos el inspector asignado en nuestra lista de usuarios
              const inspector = users?.find(u => u.id === client.inspector_id);

              return (
                <tr
                  key={client.id}
                  onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                  className="cursor-pointer hover:bg-amber-50/30 transition-colors"
                >
                  <td className="text-xs text-gray-400">
                    {((params.page || 1) - 1) * PAGE_SIZE + i + 1}
                  </td>
                  <td>
                    <span className="font-semibold text-gray-900 uppercase text-[11px] tracking-tight">
                      {client.client_name}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                        <UserIcon className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-700">
                            {inspector?.full_name || <span className="text-gray-300 italic">Unassigned</span>}
                        </span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                        <Activity className="h-3 w-3 text-phantom-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-phantom-600 bg-phantom-50 px-1.5 py-0.5 rounded border border-phantom-100">
                            {client.workflow_status || 'Assigned'}
                        </span>
                    </div>
                  </td>
                  <td>
                    <span className={clsx("status-badge", STATUS_COLORS[client.status])}>
                      <span className={clsx("h-1.5 w-1.5 rounded-full", STATUS_DOT[client.status])} />
                      {STATUS_LABELS[client.status]}
                    </span>
                  </td>
                  <td className="text-xs text-gray-500">{cm?.name || "—"}</td>
                  <td className="text-xs max-w-[200px] truncate">{client.location_value || "—"}</td>
                  <td className="text-xs font-mono text-gray-500">
                    { formatDateOnly(client.client_contact_date) }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination (Igual al anterior) */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3">
        <p className="text-xs text-gray-500">
          Showing {((params.page! - 1) * PAGE_SIZE) + 1}–{Math.min(params.page! * PAGE_SIZE, total)} of {total}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary py-1 px-2"
            disabled={params.page === 1}
            onClick={() => setParams((p) => ({ ...p, page: (p.page || 1) - 1 }))}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs text-gray-600">
            Page {params.page} of {data?.total_pages || 1}
          </span>
          <button
            className="btn-secondary py-1 px-2"
            disabled={params.page === data?.total_pages}
            onClick={() => setParams((p) => ({ ...p, page: (p.page || 1) + 1 }))}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Función SortTh (Igual a la original)
function SortTh({ label, field, params, onSort }: {
    label: string; field: string;
    params: ClientListParams;
    onSort: (f: string) => void;
  }) {
    const active = params.sort_by === field;
    return (
      <th className="text-left py-3 px-4">
        <button
          className={clsx("flex items-center gap-1 group uppercase text-[10px] font-bold tracking-wider", active ? "text-amber-700" : "text-gray-500")}
          onClick={() => onSort(field)}
        >
          {label}
          <ArrowUpDown className={clsx("h-3 w-3", active ? "text-amber-500" : "text-gray-300 group-hover:text-gray-400")} />
        </button>
      </th>
    );
  }