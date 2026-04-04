"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contactMethodsApi, pestIssuesApi, usersApi } from "@/services/api";
import type { ContactMethod, PestIssue, User } from "@/utils/types";
import toast from "react-hot-toast";
import { Plus, Edit2, ToggleLeft, ToggleRight, Shield, ShieldOff } from "lucide-react";
import clsx from "clsx";

type AdminTab = "contact-methods" | "pest-issues" | "users";

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("contact-methods");
  const [newCM, setNewCM] = useState("");
  const [newPI, setNewPI] = useState("");
  const qc = useQueryClient();

  // ── Contact Methods ───────────────────────────────────────
  const { data: contactMethods = [] } = useQuery<ContactMethod[]>({
    queryKey: ["contact-methods"],
    queryFn: contactMethodsApi.list,
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
          ))}
        </div>
      )}
    </div>
  );
}
