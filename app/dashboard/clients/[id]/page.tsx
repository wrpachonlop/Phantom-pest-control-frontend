"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsApi, followUpsApi, notesApi } from "@/services/api";
import type { ClientFull, FollowUp, Note, AuditLog, UserRole } from "@/utils/types";
import { STATUS_LABELS, STATUS_COLORS, STATUS_DOT } from "@/utils/types";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import clsx from "clsx";
import toast from "react-hot-toast";
import { usersApi } from "@/services/api";
import {
  ArrowLeft, Phone, Mail, MapPin, Clock, Building2, Home,
  Plus, Trash2, FileText, Activity, ChevronDown, Edit2
} from "lucide-react";
import { FollowUpModal } from "@/components/modals/FollowUpModal";
import { EditClientModal } from "@/components/modals/EditClientModal";
import { formatDateOnly } from "@/src/lib/utils";

type Tab = "follow-ups" | "notes" | "audit";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("follow-ups");
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newNote, setNewNote] = useState("");

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: usersApi.me });
  const isAdmin = me?.role === "admin" as UserRole;

  const { data: client, isLoading } = useQuery<ClientFull>({
    queryKey: ["client", id],
    queryFn: () => clientsApi.get(id),
  });

  const { data: followUps = [] } = useQuery<FollowUp[]>({
    queryKey: ["follow-ups", id],
    queryFn: () => followUpsApi.getByClient(id),
    enabled: activeTab === "follow-ups",
  });

  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ["notes", id],
    queryFn: () => notesApi.getByClient(id),
    enabled: activeTab === "notes",
  });

  const { data: auditLogs = [] } = useQuery<AuditLog[]>({
    queryKey: ["audit", id],
    queryFn: () => clientsApi.getAuditLog(id),
    enabled: activeTab === "audit",
  });

  const createNoteMutation = useMutation({
    mutationFn: () => notesApi.create(id, newNote),
    onSuccess: () => {
      setNewNote("");
      qc.invalidateQueries({ queryKey: ["notes", id] });
      toast.success("Note added");
    },
  });

  const deleteFollowUpMutation = useMutation({
    mutationFn: (fuId: string) => followUpsApi.delete(fuId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["follow-ups", id] });
      toast.success("Follow-up deleted");
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => notesApi.delete(noteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes", id] });
      toast.success("Note deleted");
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: () => clientsApi.delete(id),
    onSuccess: () => {
      toast.success("Client deleted successfully");
      // Al borrar el cliente, ya no tiene sentido estar en esta página,
      // así que volvemos a la lista principal.
      router.push("/dashboard/clients");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete client");
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-phantom-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!client) {
    return <div className="p-8 text-center text-red-600">Client not found.</div>;
  }

  const FOLLOWUP_TYPE_COLORS: Record<string, string> = {
    inbound:  "bg-blue-50 text-blue-700 border-blue-200",
    outbound: "bg-amber-50 text-amber-700 border-amber-200",
    sold:     "bg-green-50 text-green-700 border-green-200",
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-gray-200 bg-white px-6 py-4">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900">
              {client.client_name || <span className="text-gray-400 italic">Unnamed Client</span>}
            </h1>
            <span className={clsx("status-badge", STATUS_COLORS[client.status])}>
              <span className={clsx("h-1.5 w-1.5 rounded-full", STATUS_DOT[client.status])} />
              {STATUS_LABELS[client.status]}
            </span>
            {client.after_hours && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                <Clock className="h-3 w-3" /> After Hours
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {client.property_type === "residential"
              ? <span className="inline-flex items-center gap-1"><Home className="h-3 w-3" /> Residential</span>
              : <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" /> Commercial</span>
            }
            {" · "}
            <span className="capitalize">{client.client_type}</span>
            {client.contact_method && ` · ${client.contact_method.name}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
                  deleteClientMutation.mutate();
                }
              }}
              disabled={deleteClientMutation.isPending}
              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
              title="Delete Client"
            >
              {deleteClientMutation.isPending ? (
                <div className="h-4 w-4 animate-spin border-2 border-red-500 border-t-transparent rounded-full" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          )}
          <button
            onClick={() => setShowEditModal(true)}
            className="btn-secondary py-1.5 text-xs"
          >
            <Edit2 className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            onClick={() => setShowFollowUpModal(true)}
            className="btn-primary py-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Follow-up
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - client info */}
        <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto p-5 space-y-5">

          {/* Contact info */}
          <Section title="Contact">
            {client.phones.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-sm text-gray-700">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                <span>{p.phone_number}</span>
                {p.label !== "primary" && <span className="text-xs text-gray-400">({p.label})</span>}
              </div>
            ))}
            {client.emails.map((e) => (
              <div key={e.id} className="flex items-center gap-2 text-sm text-gray-700">
                <Mail className="h-3.5 w-3.5 text-gray-400" />
                <span className="truncate">{e.email}</span>
              </div>
            ))}
            {client.phones.length === 0 && client.emails.length === 0 && (
              <p className="text-xs text-gray-400 italic">No contact info</p>
            )}
          </Section>

          {/* Location */}
          {client.location_value && (
            <Section title="Location">
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                <span className="capitalize">{client.location_type}: {client.location_value}</span>
              </div>
            </Section>
          )}

          {/* Key dates */}
          <Section title="Dates">
            <InfoRow label="Contact Date" value={ formatDateOnly(client.client_contact_date) } />
            <InfoRow
              label="First Follow-up"
              value={client.first_contact_date
                ? formatDateOnly(client.first_contact_date)
                : "—"
              }
            />
            {client.sold_date && (
              <InfoRow label="Sold Date" value={formatDateOnly(client.sold_date)} />
            )}
          </Section>

          {/* Pest issues */}
          {client.pest_issues.length > 0 && (
            <Section title="Pest Issues">
              <div className="flex flex-wrap gap-1.5">
                {client.pest_issues.map((pi) => (
                  <span
                    key={pi.id}
                    className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 capitalize"
                  >
                    {pi.name}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Sales info */}
          {client.status === "green" && (
            <Section title="Sale Info">
              {client.sale_range && <InfoRow label="Sale Range" value={client.sale_range} />}
              {client.sold_by_user && (
                <InfoRow
                  label="Sold By"
                  value={client.sold_by_user.full_name || client.sold_by_user.email}
                />
              )}
            </Section>
          )}

          {/* Problem description */}
          {client.problem_description && (
            <Section title="Problem Description">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{client.problem_description}</p>
            </Section>
          )}
        </div>

        {/* Right panel - tabs */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          {/* Tab bar */}
          <div className="flex border-b border-gray-200 bg-white px-6">
            {(["follow-ups", "notes", "audit"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors capitalize",
                  activeTab === tab
                    ? "border-phantom-600 text-phantom-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                {tab === "follow-ups" && <FileText className="h-4 w-4" />}
                {tab === "notes" && <FileText className="h-4 w-4" />}
                {tab === "audit" && <Activity className="h-4 w-4" />}
                {tab.replace("-", " ")}
                {tab === "follow-ups" && followUps.length > 0 && (
                  <span className="rounded-full bg-phantom-100 text-phantom-700 text-xs px-1.5 py-0.5 font-medium">
                    {followUps.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Follow-ups */}
            {activeTab === "follow-ups" && (
              <div className="space-y-3">
                {followUps.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No follow-ups yet.</p>
                    <button onClick={() => setShowFollowUpModal(true)} className="btn-primary mt-3 text-xs py-1.5">
                      <Plus className="h-3.5 w-3.5" /> Add First Follow-up
                    </button>
                  </div>
                )}
                {followUps.map((fu) => (
                  <div key={fu.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={clsx(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border capitalize",
                            FOLLOWUP_TYPE_COLORS[fu.type]
                          )}>
                            {fu.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDateOnly(fu.date)}
                          </span>
                          {fu.created_by_user && (
                            <span className="text-xs text-gray-400">
                              by {fu.created_by_user.full_name || fu.created_by_user.email}
                            </span>
                          )}
                        </div>
                        {fu.description && (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{fu.description}</p>
                        )}
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => deleteFollowUpMutation.mutate(fu.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            {activeTab === "notes" && (
              <div className="space-y-3">
                {/* New note input */}
                <div className="card p-4">
                  <textarea
                    className="input-base resize-none"
                    rows={3}
                    placeholder="Add an internal note…"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => createNoteMutation.mutate()}
                      disabled={!newNote.trim() || createNoteMutation.isPending}
                      className="btn-primary py-1.5 text-xs"
                    >
                      Save Note
                    </button>
                  </div>
                </div>

                {notes.map((note) => (
                  <div key={note.id} className="card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-700">
                            {note.user_full_name || note.user_email || "Unknown"}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDateOnly(note.created_at, "MMM d, yyyy HH:mm")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note}</p>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => deleteNoteMutation.mutate(note.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Audit log */}
            {activeTab === "audit" && (
              <div className="space-y-2">
                {auditLogs.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-12">No audit history.</p>
                )}
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 rounded-lg bg-white border border-gray-100 p-3">
                    <div className={clsx(
                      "rounded-full p-1.5 flex-shrink-0",
                      log.action === "create" ? "bg-green-100" :
                      log.action === "update" ? "bg-blue-100" :
                      "bg-red-100"
                    )}>
                      <Activity className={clsx(
                        "h-3 w-3",
                        log.action === "create" ? "text-green-600" :
                        log.action === "update" ? "text-blue-600" :
                        "text-red-600"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600">
                        <span className="font-medium capitalize">{log.action}</span>
                        {" on "}
                        <span className="font-medium">{log.entity_type.replace("_", " ")}</span>
                        {log.user_full_name || log.user_email
                          ? ` by ${log.user_full_name || log.user_email}`
                          : ""}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDateOnly(log.created_at, "MMM d, yyyy HH:mm:ss")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showFollowUpModal && (
        <FollowUpModal
          clientId={id}
          onClose={() => setShowFollowUpModal(false)}
          onSuccess={() => {
            setShowFollowUpModal(false);
            qc.invalidateQueries({ queryKey: ["follow-ups", id] });
            qc.invalidateQueries({ queryKey: ["client", id] });
          }}
        />
      )}

      {showEditModal && client && (
        <EditClientModal
          client={client}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            qc.invalidateQueries({ queryKey: ["client", id] });
          }}
        />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-xs font-medium text-gray-800 text-right truncate">{value}</span>
    </div>
  );
}
