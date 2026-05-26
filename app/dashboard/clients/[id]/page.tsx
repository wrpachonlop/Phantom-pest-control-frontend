"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsApi, followUpsApi, notesApi } from "@/services/api";
import type { ClientFull, FollowUp, Note, AuditLog, UserRole, ClientStatus } from "@/utils/types";
import { STATUS_LABELS, STATUS_COLORS, STATUS_DOT, COMMERCIAL_STATUS_COLORS, COMMERCIAL_STATUS_LABELS } from "@/utils/types";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import clsx from "clsx";
import toast from "react-hot-toast";
import { usersApi } from "@/services/api";
import {
  ArrowLeft, Phone, Mail, MapPin, Clock, Building2, Home,
  Plus, Trash2, FileText, Activity, ChevronDown, Edit2,
  ArrowRightLeft
} from "lucide-react";
import { FollowUpModal } from "@/components/modals/FollowUpModal";
import { EditClientModal } from "@/components/modals/EditClientModal";
import { formatDateOnly } from "@/src/lib/utils";
import { CommercialFollowUpModal } from "@/components/modals/CommercialFollowUpModal";

type Tab = "overview" | "follow-ups" | "notes" | "audit";

export default function ClientDetailPage() {

  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null); // Para editar follow-ups
  const [showWorkflowModal, setShowWorkflowModal] = useState(false); // Nuevo estado para el modal de workflow

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
  const updateFollowUpMutation = useMutation({
  // fuid es el ID del follow-up, y data es el DTO que armamos en Go
    mutationFn: ({ fuId, data }: { fuId: string; data: any }) => 
      followUpsApi.update(fuId, data), 
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["follow-ups", id] });
      toast.success("Follow-up updated successfully");
      setShowFollowUpModal(false); // Cerramos el modal tras éxito
      setSelectedFollowUp(null);   // Limpiamos el estado
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update follow-up");
    }
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
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client deleted successfully");
      // Al borrar el cliente, ya no tiene sentido estar en esta página,
      // así que volvemos a la lista principal.
      router.push("/dashboard/clients");
      router.refresh();
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


  const isCommercial = client.property_type === "commercial";

  let badgeColor = "";
  let dotColor = "";
  let label = "";


 if (isCommercial) {
    // Aseguramos un fallback en string plano para el flujo comercial
    const wfStatus = client.workflow_status ?? "assigned";
    
    badgeColor = COMMERCIAL_STATUS_COLORS[wfStatus as keyof typeof COMMERCIAL_STATUS_COLORS] || COMMERCIAL_STATUS_COLORS["assigned"];
    dotColor = COMMERCIAL_STATUS_COLORS[wfStatus as keyof typeof COMMERCIAL_STATUS_COLORS] || COMMERCIAL_STATUS_COLORS["assigned"];
    label = COMMERCIAL_STATUS_LABELS[wfStatus as keyof typeof COMMERCIAL_STATUS_LABELS] || COMMERCIAL_STATUS_LABELS["assigned"];
  } else {
    // Para residenciales, forzamos el tipo ClientStatus para que haga match con tus Records tradicionales
    const resStatus = (client.status as ClientStatus) || "blue";
    
    badgeColor = STATUS_COLORS[resStatus];
    dotColor = STATUS_DOT[resStatus];
    label = STATUS_LABELS[resStatus];
  }

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
            <span className={clsx("status-badge", badgeColor)}>
              <span className={clsx("h-1.5 w-1.5 rounded-full", dotColor)} />
              {label}
            </span>
            {client.after_hours && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                <Clock className="h-3 w-3" /> After Hours
              </span>
            )}
            {client.property_type === "commercial" && (
            <button
              onClick={() => setShowWorkflowModal(true)}
              className="inline-flex items-center gap-x-1.5 rounded-md bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-amber-500 transition-colors ml-auto sm:ml-2"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Update Stage
            </button>
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
        

        {/* Right panel - tabs */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          
          {/* Tab bar */}
          <div className="flex border-b border-gray-200 bg-white px-6">
            {(["overview", "follow-ups", "notes", "audit"] as Tab[]).map((tab) => (
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
                {tab === "overview" && (client.property_type === "commercial" ? <Building2 className="h-4 w-4" /> : <Home className="h-4 w-4" />)}
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
              {/* Overview */}
              {activeTab === "overview" && (
              <div className="space-y-6 max-w-5xl">
                {/* Grid Principal: Se adapta a 1 columna en móvil y 3 columnas en pantallas grandes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  
                  {/* Tarjeta 1: Datos de Contacto y Ubicación */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                    <Section title="Contact Information">
                      {client.phones.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 text-sm text-gray-700 py-1 border-b border-gray-50 last:border-0">
                          <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="font-medium">{p.phone_number}</span>
                          {p.label !== "primary" && <span className="text-xs text-gray-400 capitalize">({p.label})</span>}
                        </div>
                      ))}
                      {client.emails.map((e) => (
                        <div key={e.id} className="flex items-center gap-3 text-sm text-gray-700 py-1 border-b border-gray-50 last:border-0">
                          <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate font-medium">{e.email}</span>
                        </div>
                      ))}
                      {client.phones.length === 0 && client.emails.length === 0 && (
                        <p className="text-xs text-gray-400 italic">No contact info registered.</p>
                      )}
                    </Section>

                    {client.location_value && (
                      <Section title="Location Details">
                        <div className="flex items-start gap-2.5 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-xs text-gray-400 block capitalize">{client.location_type}</span>
                            <span className="font-medium">{client.location_value}</span>
                          </div>
                        </div>
                      </Section>
                    )}
                  </div>

                  {/* Tarjeta 2: Fechas Clave y Clasificación */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                    <Section title="Key Milestones">
                      <div className="space-y-2">
                        <InfoRow label="Contact Date" value={formatDateOnly(client.client_contact_date)} />
                        <InfoRow
                          label="First Follow-up"
                          value={client.first_contact_date ? formatDateOnly(client.first_contact_date) : "—"}
                        />
                        {client.sold_date && (
                          <InfoRow label="Sold Date" value={formatDateOnly(client.sold_date)} />
                        )}
                      </div>
                    </Section>

                    {client.pest_issues.length > 0 && (
                      <Section title="Active Pest Issues">
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {client.pest_issues.map((pi) => (
                            <span
                              key={pi.id}
                              className="rounded-full bg-red-50 border border-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 capitalize"
                            >
                              {pi.name}
                            </span>
                          ))}
                        </div>
                      </Section>
                    )}

                    {client.status === "green" && (
                      <Section title="Sales Metadata">
                        <div className="space-y-2">
                          {client.sale_range && <InfoRow label="Sale Range" value={client.sale_range} />}
                          {client.sold_by_user && (
                            <InfoRow
                              label="Sold By"
                              value={client.sold_by_user.full_name || client.sold_by_user.email}
                            />
                          )}
                        </div>
                      </Section>
                    )}
                  </div>

                  {/* Tarjeta 3: Descripción del Problema */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <Section title="Problem Description">
                      {client.problem_description ? (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-[100px]">
                          {client.problem_description}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No description provided.</p>
                      )}
                    </Section>
                  </div>
                </div>

                {/* BLOQUE DINÁMICO EXCLUSIVO: Si el cliente es comercial y tiene datos del workflow */}
                {isCommercial && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
                    <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-amber-600" />
                        Commercial Contract & Operations Profile
                      </h3>
                      {client.inspector_name && (
                        <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-md px-2.5 py-1 font-medium">
                          Assigned Inspector: <strong>{client.inspector_name}</strong>
                        </span>
                      )}
                    </div>

                    {/* Sub-grid de datos comerciales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Detalles de Identidad y Envío */}
                      <div className="space-y-3.5">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase">Business Identity</h4>
                        <InfoRow label="Company Name" value={client.commercial_details?.company_name || "—"} />
                        <InfoRow label="Contact Person" value={client.commercial_details?.contact_person_name || "—"} />
                        <InfoRow label="Service Address" value={client.commercial_details?.service_address || "—"} />
                        <InfoRow label="Billing Address" value={client.commercial_details?.billing_address || "—"} />
                      </div>

                      {/* Detalles Financieros y de Agenda */}
                      <div className="space-y-3.5">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase">Financial & Schedule Terms</h4>
                        <InfoRow 
                          label="Billing Terms" 
                          value={client.commercial_details?.billing_terms?.replace("_", " ").toUpperCase() || "—"} 
                        />
                        <InfoRow 
                          label="Initial Setup Cost" 
                          value={client.commercial_details?.initial_setup_cost ? `$${Number(client.commercial_details.initial_setup_cost).toFixed(2)}` : "—"} 
                        />
                        <InfoRow 
                          label="Recurring Service Cost" 
                          value={client.commercial_details?.recurring_service_cost ? `$${Number(client.commercial_details.recurring_service_cost).toFixed(2)}` : "—"} 
                        />
                        <InfoRow 
                          label="Service Frequency" 
                          value={
                            client.commercial_details?.service_frequency 
                              ? `${client.commercial_details.service_frequency}${client.commercial_details.frequency_interval ? ` (Every ${client.commercial_details.frequency_interval})` : ''}`
                              : "—"
                          } 
                        />
                      </div>
                    </div>
                    
                    {/* Metadatos de Aprobación Final */}
                    {client.commercial_details?.approved_by_name && (
                      <div className="bg-green-50/50 border border-green-100 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500 block">Authorized Proposal Approved By</span>
                          <span className="font-bold text-green-900 text-sm">{client.commercial_details.approved_by_name}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Approval Date</span>
                          <span className="font-bold text-green-900 text-sm">
                            {client.commercial_details.approved_date ? formatDateOnly(client.commercial_details.approved_date) : "—"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {/* Follow-ups */}
            {activeTab === "follow-ups" && (
              <div className="space-y-3">
                {followUps.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No follow-ups yet.</p>
                    <button onClick={() => setShowFollowUpModal(true)} className="btn-primary mt-3 text-xs py-1.5">
                      <Plus className="h-3.5 w-3.5" /> 
                      {client.property_type === "commercial" ? "Add Commercial Follow-up" : "Add First Follow-up"}
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
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedFollowUp(fu); // Necesitas un estado para guardar el FU a editar
                            setShowFollowUpModal(true);
                          }}
                          className="text-gray-300 hover:text-blue-500 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" /> {/* Usa el icono de Edit de Lucide */}
                        </button>

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
          followUp={selectedFollowUp}
          onClose={() => {
            setShowFollowUpModal(false);
            setSelectedFollowUp(null); // <--- Limpiamos al cerrar
          }}
          onSuccess={() => {
            setShowFollowUpModal(false);
            setSelectedFollowUp(null);
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
      {showWorkflowModal && (
        <CommercialFollowUpModal
            currentWorkflowStatus={client.workflow_status ?? "assigned"}
            clientId={client.id}
            onClose={() => setShowWorkflowModal(false)}
            onSuccess={() => {
              // Aquí disparas el refresh de la data del cliente para actualizar la UI
              setShowWorkflowModal(false);
              // Invalidamos la caché exactamente igual para actualizar la UI corporativa
               qc.invalidateQueries({ queryKey: ["follow-ups", id] });
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


