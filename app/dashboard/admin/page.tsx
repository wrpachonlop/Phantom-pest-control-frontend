"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contactMethodsApi, pestIssuesApi, usersApi, crewMembersApi, CrewMember, commercialApi } from "@/services/api";
import type { ContactMethod, PestIssue, User } from "@/utils/types";
import  { toast } from "react-hot-toast";
import { Plus, Edit2, ToggleLeft, ToggleRight, Shield, ShieldOff, UserPlus, ClipboardCheck, Mail, Phone, X } from "lucide-react";
import clsx from "clsx";

type AdminTab = "contact-methods" | "pest-issues" | "users" | "crew";

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("contact-methods");
  const [newCM, setNewCM] = useState("");
  const [newCrewName, setNewCrewName] = useState("");
  const [isInspector, setIsInspector] = useState(false);
  const [newCrewEmail, setNewCrewEmail] = useState("");
  const [newCrewPhone, setNewCrewPhone] = useState("");
  const [editingMember, setEditingMember] = useState<CrewMember | null>(null);
  const [newPI, setNewPI] = useState("");
  const qc = useQueryClient();
  const [newCrewID, setNewCrewID] = useState("");

  // ── Contact Methods ───────────────────────────────────────
  const { data: contactMethods = [] } = useQuery<ContactMethod[]>({
    queryKey: ["contact-methods"],
    queryFn: contactMethodsApi.list,
  });


  const { data: crewMembers = [] } = useQuery<CrewMember[]>({
    queryKey: ["crew-members"],
    queryFn: crewMembersApi.list,
    enabled: tab === "crew",
  });
  const toggleCrewInspector = useMutation({
    mutationFn: ({ id, is_inspector }: { id: string; is_inspector: boolean }) =>
      commercialApi.setInspectorFlagForCrewMember(id, is_inspector),
    onSuccess: () => {
      // IMPORTANTE: Verifica si usas "crew" o "crew-members" en tu useQuery original
      qc.invalidateQueries({ queryKey: ["crew-members"] }); 
      toast.success("Inspector status updated");
    },
    onError: (err: any) => {
      // Log para depuración en desarrollo
      console.error("Crew Toggle Error:", err);
      const errorMessage = err?.response?.data?.error || "Failed to update status";
      toast.error(errorMessage);
    },
  });

  const toggleInspector = useMutation({
  mutationFn: ({ id, is_inspector }: { id: string; is_inspector: boolean }) =>
    commercialApi.setInspectorFlag(id, is_inspector),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ["users"] });
    toast.success("Inspector role updated");
  },
  onError: (err: any) => {
    toast.error(err?.response?.data?.error || "Failed to update role");
  },
});

  const updateCrewMutation = useMutation({
  // Desestructuramos el id para la URL y el resto para el body
  mutationFn: (member: CrewMember) =>
    crewMembersApi.update(member.id, {
      full_name: member.full_name,
      email: member.email,
      phone_number: member.phone_number,
      employee_id: member.employee_id,
      is_active: member.is_active,
      is_inspector: member.is_inspector,
    }),
  onSuccess: () => {
    // 1. Invalidamos la lista para ver los cambios reflejados
    qc.invalidateQueries({ queryKey: ["crew-members"] });
    
    // 2. Cerramos el modal de edición
    setEditingMember(null);
    
    // 3. Notificamos al usuario
    toast.success("Crew member updated successfully");
  },
  onError: (err: any) => {
    const errorMsg = err?.response?.data?.error || "Error updating crew member";
    toast.error(errorMsg);
  },
});
  const createCrew = useMutation({
    mutationFn: () => crewMembersApi.create({ 
      full_name: newCrewName,
      email: newCrewEmail,
      phone_number: newCrewPhone,
      employee_id: newCrewID,
      is_inspector: isInspector
    }),
    onSuccess: () => {
      setNewCrewName("");
      setNewCrewID("");
      setNewCrewEmail("");
      setNewCrewPhone("");
      setIsInspector(false);
      qc.invalidateQueries({ queryKey: ["crew-members"] });
      toast.success("Crew member added");
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to add crew member"),
  });
  const createCM = useMutation({
    mutationFn: () => contactMethodsApi.create(newCM),
    onSuccess: () => {
      setNewCM("");
      qc.invalidateQueries({ queryKey: ["contact-methods"] });
      toast.success("Contact method added");
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || "Failed"),
  });

  const toggleCM = useMutation({
    mutationFn: (m: ContactMethod) => contactMethodsApi.update(m.id, { is_active: !m.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contact-methods"] }),
  });

  // ── Pest Issues ───────────────────────────────────────────
  const { data: pestIssues = [] } = useQuery<PestIssue[]>({
    queryKey: ["pest-issues"],
    queryFn: pestIssuesApi.list,
  });

  const createPI = useMutation({
    mutationFn: () => pestIssuesApi.create(newPI),
    onSuccess: () => {
      setNewPI("");
      qc.invalidateQueries({ queryKey: ["pest-issues"] });
      toast.success("Pest issue added");
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || "Failed"),
  });

  const togglePI = useMutation({
    mutationFn: (pi: PestIssue) => pestIssuesApi.update(pi.id, { is_active: !pi.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pest-issues"] }),
  });

  // ── Users ─────────────────────────────────────────────────
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: usersApi.list,
    enabled: tab === "users",
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: "admin" | "user" }) =>
      usersApi.updateRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role updated");
    },
  });

  const TABS: { id: AdminTab; label: string }[] = [
    { id: "contact-methods", label: "Contact Methods" },
    { id: "pest-issues",     label: "Pest Issues" },
    { id: "users",           label: "Users" },
    { id: "crew",            label: "Crew Members" },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage dynamic lookup tables and user roles.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 mb-5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Contact Methods ─────────────────────────────────── */}
      {tab === "contact-methods" && (
        <div className="space-y-3">
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Add Contact Method</h2>
            <div className="flex gap-2">
              <input
                className="input-base flex-1"
                placeholder="e.g. web chat"
                value={newCM}
                onChange={(e) => setNewCM(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && newCM.trim() && createCM.mutate()}
              />
              <button
                onClick={() => newCM.trim() && createCM.mutate()}
                disabled={!newCM.trim() || createCM.isPending}
                className="btn-primary"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
          </div>

          <div className="card divide-y divide-gray-100">
            {contactMethods.length === 0 && (
              <p className="p-4 text-sm text-gray-400 text-center">No contact methods yet.</p>
            )}
            {contactMethods.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={clsx(
                    "h-2 w-2 rounded-full",
                    m.is_active ? "bg-green-500" : "bg-gray-300"
                  )} />
                  <span className="text-sm font-medium text-gray-800 capitalize">{m.name}</span>
                  {!m.is_active && (
                    <span className="text-xs text-gray-400 italic">(inactive)</span>
                  )}
                </div>
                <button
                  onClick={() => toggleCM.mutate(m)}
                  title={m.is_active ? "Deactivate" : "Activate"}
                  className={clsx(
                    "text-sm transition-colors",
                    m.is_active ? "text-green-600 hover:text-red-500" : "text-gray-400 hover:text-green-600"
                  )}
                >
                  {m.is_active
                    ? <ToggleRight className="h-5 w-5" />
                    : <ToggleLeft className="h-5 w-5" />
                  }
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Pest Issues ──────────────────────────────────────── */}
      {tab === "pest-issues" && (
        <div className="space-y-3">
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Add Pest Issue</h2>
            <div className="flex gap-2">
              <input
                className="input-base flex-1"
                placeholder="e.g. centipedes"
                value={newPI}
                onChange={(e) => setNewPI(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && newPI.trim() && createPI.mutate()}
              />
              <button
                onClick={() => newPI.trim() && createPI.mutate()}
                disabled={!newPI.trim() || createPI.isPending}
                className="btn-primary"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
          </div>

          <div className="card divide-y divide-gray-100">
            {pestIssues.length === 0 && (
              <p className="p-4 text-sm text-gray-400 text-center">No pest issues yet.</p>
            )}
            {pestIssues.map((pi) => (
              <div key={pi.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={clsx(
                    "h-2 w-2 rounded-full",
                    pi.is_active ? "bg-green-500" : "bg-gray-300"
                  )} />
                  <span className="text-sm font-medium text-gray-800 capitalize">{pi.name}</span>
                  {!pi.is_active && <span className="text-xs text-gray-400 italic">(inactive)</span>}
                </div>
                <button
                  onClick={() => togglePI.mutate(pi)}
                  title={pi.is_active ? "Deactivate" : "Activate"}
                  className={clsx(
                    "transition-colors",
                    pi.is_active ? "text-green-600 hover:text-red-500" : "text-gray-400 hover:text-green-600"
                  )}
                >
                  {pi.is_active
                    ? <ToggleRight className="h-5 w-5" />
                    : <ToggleLeft className="h-5 w-5" />
                  }
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Users ────────────────────────────────────────────── */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="flex justify-between px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <span>User Details</span>
            <div className="flex gap-8 mr-2">
              <span>Inspector</span>
              <span>Admin Status</span>
            </div>
          </div>
          <div className="card divide-y divide-gray-100">
            {users.length === 0 && (
              <p className="p-4 text-sm text-gray-400 text-center">No users found.</p>
            )}
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-phantom-100 flex items-center justify-center text-xs font-bold text-phantom-700">
                    {(u.full_name || u.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {u.full_name || u.email.split("@")[0]}
                    </p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={clsx(
                    "text-xs font-medium rounded-full px-2.5 py-0.5 capitalize",
                    u.role === "admin"
                      ? "bg-phantom-100 text-phantom-700"
                      : "bg-gray-100 text-gray-600"
                  )}>
                    {u.role}
                  </span>



                  <div className="flex items-center gap-2 border-l pl-4 border-gray-100">
                    {/* Toggle Inspector (NUEVO) */}
                    <button
                      onClick={() => toggleInspector.mutate({ id: u.id, is_inspector: !u.is_inspector })}
                      title={u.is_inspector ? "Remove Inspector role" : "Mark as Inspector"}
                      className={clsx(
                        "transition-colors flex items-center gap-1",
                        u.is_inspector ? "text-blue-600" : "text-gray-300 hover:text-blue-500"
                      )}
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      {u.is_inspector && <span className="text-[10px] font-bold">INS</span>}
                    </button>
                    <button
                      onClick={() =>
                        updateRole.mutate({
                          id: u.id,
                          role: u.role === "admin" ? "user" : "admin",
                        })
                      }
                      title={u.role === "admin" ? "Demote to user" : "Promote to admin"}
                      className={clsx(
                        "transition-colors",
                        u.role === "admin"
                          ? "text-phantom-600 hover:text-gray-400"
                          : "text-gray-400 hover:text-phantom-600"
                      )}
                    >
                      {u.role === "admin"
                        ? <Shield className="h-4 w-4" />
                        : <ShieldOff className="h-4 w-4" />
                      }
                    </button>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* ── Crew Members ────────────────────────────────────────── */}
      {tab === "crew" && (
        <div className="space-y-3">
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Add Crew Member</h2>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  className="input-base flex-1"
                  placeholder="Full Name"
                  value={newCrewName}
                  onChange={(e) => setNewCrewName(e.target.value)}
                />
                <input
                  className="input-base flex-1"
                  type="email"
                  placeholder="Email"
                  value={newCrewEmail}
                  onChange={(e) => setNewCrewEmail(e.target.value)}
                />
                <input
                  className="input-base flex-1"
                  type="tel"
                  placeholder="Phone Number"
                  value={newCrewPhone} // Asegúrate de declarar: const [newCrewPhone, setNewCrewPhone] = useState("");
                  onChange={(e) => setNewCrewPhone(e.target.value)}
                />
                <input
                  className="input-base w-32"
                  placeholder="ID (Opt)"
                  value={newCrewID}
                  onChange={(e) => setNewCrewID(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
              {/* Un simple checkbox o toggle al lado del botón de acción */}
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox"
                  checked={isInspector}
                  onChange={(e) => setIsInspector(e.target.checked)}
                  className="rounded border-gray-300 text-phantom-600 focus:ring-phantom-500 h-4 w-4"
                />
                <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                  Assign as Inspector
                </span>
              </label>

              <button
                onClick={() => newCrewName.trim() && createCrew.mutate()}
                disabled={!newCrewName.trim() || !newCrewEmail.trim() || createCrew.isPending}
                className="btn-primary px-6 flex items-center justify-center py-2"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Member
              </button>
            </div>
            </div>
          </div>

          <div className="card divide-y divide-gray-100">
            {crewMembers.length === 0 && (
              <p className="p-4 text-sm text-gray-400 text-center">No crew members yet.</p>
            )}
            {crewMembers.map((member) => (
              <div key={member.id} className="group flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                    <span className="text-sm font-bold text-phantom-700">
                      {member.full_name[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{member.full_name}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {member.email}
                      </span>
                      {member.phone_number && (
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {member.phone_number}
                        </span>
                      )}
                      {member.employee_id && (
                        <span className="text-[10px] text-phantom-600 font-mono bg-phantom-50 px-1 rounded">
                          ID: {member.employee_id}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* NUEVO: Toggle Inspector para Crew */}
                  <button
                    onClick={() => toggleCrewInspector.mutate({ id: member.id, is_inspector: !member.is_inspector })}
                    title={member.is_inspector ? "Remove Inspector Status" : "Make Inspector"}
                    className={clsx(
                      "flex items-center gap-1 px-2 py-1 rounded transition-colors",
                      member.is_inspector 
                        ? "bg-blue-50 text-blue-600 border border-blue-100" 
                        : "text-gray-300 hover:text-blue-500"
                    )}
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    {member.is_inspector && <span className="text-[10px] font-bold">INS</span>}
                  </button>
                  <button 
                    onClick={() => setEditingMember(member)}
                    className="p-2 text-gray-400 hover:text-phantom-600 hover:bg-phantom-50 rounded-lg transition-all"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-2">
                    <span className={clsx(
                        "h-2 w-2 rounded-full",
                        member.is_active ? "bg-green-500" : "bg-gray-300"
                      )} />
                      <span className="text-xs text-gray-500">
                        {member.is_active ? "Active" : "Inactive"}
                      </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        
      )}
      {editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Edit Crew Member</h3>
              <button onClick={() => setEditingMember(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Full Name</label>
                <input 
                  className="input-base w-full"
                  value={editingMember.full_name}
                  onChange={e => setEditingMember({...editingMember, full_name: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Email</label>
                  <input 
                    className="input-base w-full"
                    value={editingMember.email}
                    onChange={e => setEditingMember({...editingMember, email: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Phone</label>
                  <input 
                    className="input-base w-full"
                    value={editingMember.phone_number}
                    onChange={e => setEditingMember({...editingMember, phone_number: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Role & Status</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editingMember.is_inspector}
                      onChange={e => setEditingMember({...editingMember, is_inspector: e.target.checked})}
                      className="rounded border-gray-300 text-phantom-600"
                    />
                    <span className="text-xs text-gray-600">Inspector</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editingMember.is_active}
                      onChange={e => setEditingMember({...editingMember, is_active: e.target.checked})}
                      className="rounded border-gray-300 text-phantom-600"
                    />
                    <span className="text-xs text-gray-600">Active</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t flex gap-3">
              <button 
                onClick={() => setEditingMember(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button 
                onClick={() => updateCrewMutation.mutate(editingMember)}
                className="btn-primary flex-1"
                disabled={updateCrewMutation.isPending}
              >
                {updateCrewMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
