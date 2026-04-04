"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { clientsApi, contactMethodsApi, ClientListParams } from "@/services/api";
import type { Client, ClientStatus, PropertyType, PaginatedResponse, ContactMethod } from "@/utils/types";
import { STATUS_LABELS, STATUS_COLORS, STATUS_DOT } from "@/utils/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  Search, Plus, Filter, ChevronLeft, ChevronRight,
  ArrowUpDown, Clock, Building2, Home
} from "lucide-react";
import { format } from "date-fns";

const PAGE_SIZE = 50;

export default function ClientsPage() {
  const router = useRouter();
  const [params, setParams] = useState<ClientListParams>({
    page: 1, page_size: PAGE_SIZE,
    sort_by: "created_at", sort_dir: "desc",
  });
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<PaginatedResponse<Client>>({
    queryKey: ["clients", params],
    queryFn: () => clientsApi.list(params),
    placeholderData: (prev) => prev,
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
        <h1 className="text-base font-semibold text-gray-900 mr-2">Clients</h1>

        {/* Search */}
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            className="input-base pl-9 py-1.5 text-xs"
            placeholder="Search name, location…"
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
                  ? s
                    ? STATUS_COLORS[s]
                    : "bg-phantom-600 text-white border-phantom-600"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              )}
            >
              {s ? STATUS_LABELS[s] : "All"}
            </button>
          ))}
        </div>

        {/* Property type filter */}
        <select
          value={params.property_type || ""}
          onChange={(e) => setParams((p) => ({ ...p, property_type: e.target.value as PropertyType || undefined, page: 1 }))}
          className="input-base py-1.5 text-xs w-32"
        >
          <option value="">All types</option>
          <option value="residential">Residential</option>
          <option value="commercial">Commercial</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-500">{total} clients</span>
          <Link href="/dashboard/clients/new" className="btn-primary py-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> New Client
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="data-table w-full">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="w-8">#</th>
              <SortTh label="Name" field="client_name" params={params} onSort={handleSort} />
              <th>Type</th>
              <SortTh label="Status" field="status" params={params} onSort={handleSort} />
              <SortTh label="Contact Date" field="client_contact_date" params={params} onSort={handleSort} />
              <th>Contact Method</th>
              <th>Location</th>
              <th>After Hours</th>
              <SortTh label="First Contact" field="first_contact_date" params={params} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-400">
                  <div className="inline-block animate-spin h-5 w-5 border-2 border-phantom-500 border-t-transparent rounded-full" />
                </td>
              </tr>
            )}
            {!isLoading && clients.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-400 text-sm">
                  No clients found.{" "}
                  <Link href="/dashboard/clients/new" className="text-phantom-600 underline">
                    Add the first one
                  </Link>
                </td>
              </tr>
            )}
            {clients.map((client, i) => {
              const cm = contactMethods?.find((m) => m.id === client.contact_method_id);
              return (
                <tr
                  key={client.id}
                  onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                  className="cursor-pointer"
                >
                  <td className="text-xs text-gray-400">
                    {((params.page || 1) - 1) * PAGE_SIZE + i + 1}
                  </td>
                  <td>
                    <span className="font-medium text-gray-900">
                      {client.client_name || <span className="text-gray-400 italic">Unnamed</span>}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      {client.property_type === "residential"
                        ? <Home className="h-3.5 w-3.5 text-blue-400" />
                        : <Building2 className="h-3.5 w-3.5 text-amber-500" />
                      }
                      <span className="text-xs capitalize">{client.property_type}</span>
                    </div>
                  </td>
                  <td>
                    <span className={clsx("status-badge", STATUS_COLORS[client.status])}>
                      <span className={clsx("h-1.5 w-1.5 rounded-full", STATUS_DOT[client.status])} />
                      {STATUS_LABELS[client.status]}
                    </span>
                  </td>
                  <td className="text-xs">{format(new Date(client.client_contact_date), "MMM d, yyyy")}</td>
                  <td className="text-xs capitalize">{cm?.name || "—"}</td>
                  <td className="text-xs">{client.location_value || "—"}</td>
                  <td>
                    {client.after_hours && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                        <Clock className="h-3 w-3" /> After hrs
                      </span>
                    )}
                  </td>
                  <td className="text-xs">
                    {client.first_contact_date
                      ? format(new Date(client.first_contact_date), "MMM d, yyyy")
                      : <span className="text-gray-300">—</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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

function SortTh({ label, field, params, onSort }: {
  label: string; field: string;
  params: ClientListParams;
  onSort: (f: string) => void;
}) {
  const active = params.sort_by === field;
  return (
    <th>
      <button
        className={clsx("flex items-center gap-1 group", active && "text-phantom-600")}
        onClick={() => onSort(field)}
      >
        {label}
        <ArrowUpDown className={clsx("h-3 w-3", active ? "text-phantom-500" : "text-gray-300 group-hover:text-gray-400")} />
      </button>
    </th>
  );
}
