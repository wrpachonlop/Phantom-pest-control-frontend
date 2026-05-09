"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contactMethodsApi, pestIssuesApi, usersApi, crewMembersApi, CrewMember, commercialApi } from "@/services/api";
import type { ContactMethod, PestIssue, User } from "@/utils/types";
import toast from "react-hot-toast";
import { Plus, Edit2, ToggleLeft, ToggleRight, Shield, ShieldOff, UserPlus, ClipboardCheck } from "lucide-react";
import clsx from "clsx";
import { CreateInspectorModal } from "@/components/modals/CreateInspectorModal";

type AdminTab = "contact-methods" | "pest-issues" | "users" | "crew";

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("contact-methods");
  const [newCM, setNewCM] = useState("");
  const [newCrewName, setNewCrewName] = useState("");
  const [isInspector, setIsInspector] = useState(false);
  const [newCrewEmail, setNewCrewEmail] = useState("");
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


  const createCrew = useMutation({
    mutationFn: () => crewMembersApi.create({ 
      full_name: newCrewName,
      email: newCrewEmail,
      employee_id: newCrewID,
      is_inspector: isInspector
    }),
    onSuccess: () => {
      setNewCrewName("");
      setNewCrewID("");
      setNewCrewEmail("");
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
              <div key={member.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-600">
                      {member.full_name[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {member.full_name}
                    </p>
                    {member.employee_id && (
                      <p className="text-[10px] text-gray-400 font-mono">ID: {member.employee_id}</p>
                    )}
                  </div>
                </div>
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
