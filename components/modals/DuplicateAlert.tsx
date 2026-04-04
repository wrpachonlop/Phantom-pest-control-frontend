"use client";

import { useRouter } from "next/navigation";
import type { DuplicateCheckResult } from "@/utils/types";
import { AlertTriangle, ArrowRight, X } from "lucide-react";
import { format } from "date-fns";
import { STATUS_LABELS, STATUS_COLORS } from "@/utils/types";
import clsx from "clsx";

interface Props {
  result: DuplicateCheckResult;
  onDismiss: () => void;
}

export function DuplicateAlert({ result, onDismiss }: Props) {
  const router = useRouter();

  if (!result.found) return null;

  return (
    <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 animate-slide-in">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-100 p-1.5 flex-shrink-0">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-900">
            Potential Duplicate Detected
          </h3>
          <p className="text-xs text-amber-700 mt-0.5">
            Found {result.clients.length} existing client{result.clients.length > 1 ? "s" : ""} matching
            the {result.match_on === "both" ? "phone number and email" : result.match_on}.
            You can still create a new client below.
          </p>

          <div className="mt-3 space-y-2">
            {result.clients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between rounded-lg bg-white border border-amber-200 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {client.client_name || <span className="italic text-gray-400">Unnamed</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={clsx("status-badge text-xs", STATUS_COLORS[client.status])}>
                      {STATUS_LABELS[client.status]}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">{client.property_type}</span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(client.client_contact_date), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                  className="flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 transition-colors"
                >
                  View <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-amber-400 hover:text-amber-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
