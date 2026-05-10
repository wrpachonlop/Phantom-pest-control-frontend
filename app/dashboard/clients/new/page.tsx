"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientsApi, contactMethodsApi, crewMembersApi, pestIssuesApi, usersApi } from "@/services/api";
import type { CreateClientForm, ContactMethod, PestIssue, DuplicateCheckResult } from "@/utils/types";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Trash2, AlertTriangle, ArrowRight } from "lucide-react";
import clsx from "clsx";
import { DuplicateAlert } from "@/components/modals/DuplicateAlert";
import { PhotonAddressInput } from "@/components/PhotonAddressInput";

const schema = z.object({
  client_name: z.string().optional(),
  client_type: z.enum(["new", "existing", "recurrent", "spam"]),
  property_type: z.enum(["residential", "commercial"]),
  status: z.enum(["blue", "white", "yellow", "purple", "green", "red"]).optional(),
  client_contact_date: z.string().min(1, "Required"),
  after_hours: z.boolean(),
  contact_method_id: z.string().min(1, "Required"),
  problem_description: z.string().optional(),
  location_type: z.enum(["address", "city"]),
  location_value: z.string().optional(),
  sale_range: z.string().optional(),
  sold_date: z.string().optional(),
  phones: z.array(z.object({ phone_number: z.string(), label: z.string() })),
  emails: z.array(z.object({ email: z.string(), label: z.string() })),
  pest_issues: z.array(z.string()),
  lead_source: z.enum(["office", "crew_member"]).optional(),
  crew_member_id: z.string().optional(),
  inspector_id: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.property_type === "commercial") {
    if (!data.inspector_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Inspector is required for commercial leads",
        path: ["inspector_id"],
      });
    }
  }
});

type FormValues = z.infer<typeof schema>;

export default function NewClientPage() {
  
  const router = useRouter();
  const qc = useQueryClient();
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult | null>(null);

  const { data: contactMethods = [] } = useQuery<ContactMethod[]>({
    queryKey: ["contact-methods"],
    queryFn: contactMethodsApi.list,
  });

  const { data: pestIssues = [] } = useQuery<PestIssue[]>({
    queryKey: ["pest-issues"],
    queryFn: pestIssuesApi.list,
  });
  const getLocalToday = () => {
  const now = new Date();
    // Ajustamos la fecha restando el offset de la zona horaria local manualmente
    const offset = now.getTimezoneOffset() * 60000; 
    const localISOTime = new Date(now.getTime() - offset).toISOString();
    return localISOTime.split("T")[0]; // Devuelve "YYYY-MM-DD" en tu hora local
  };
  const {
    register, handleSubmit, watch, control,
    formState: { errors },
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      client_type: "new",
      property_type: "residential",
      status: "blue",
      after_hours: false,
      location_type: "address",
      client_contact_date: getLocalToday(),
      phones: [{ phone_number: "", label: "primary" }],
      emails: [],
      pest_issues: [],
    },
  });

  const { data: crewMembers = [] } = useQuery({
    queryKey: ["crew-members"],
    queryFn: crewMembersApi.list,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.list, // O el servicio que usemos para listar staff
  });
  const { fields: phoneFields, append: addPhone, remove: removePhone } = useFieldArray({ control, name: "phones" });
  const { fields: emailFields, append: addEmail, remove: removeEmail } = useFieldArray({ control, name: "emails" });

  const watchStatus = watch("status");
  const watchContactMethod = watch("contact_method_id");
  const watchPhones = watch("phones");
  const watchEmails = watch("emails");
  const watchPropertyType = watch("property_type");

  // Find selected contact method
  const selectedContactMethod = contactMethods.find((m) => m.id === watchContactMethod);

  // Validation: phone required for phone call / text
  const phoneRequired = selectedContactMethod?.name === "phone call" || selectedContactMethod?.name === "text";
  const emailRequired = selectedContactMethod?.name === "mail" || selectedContactMethod?.name === "estimate form";

  // Duplicate check mutation (fires on blur of phone/email)
  const dupCheckMutation = useMutation({
    mutationFn: () => {
      const phones = watchPhones.map((p) => p.phone_number).filter(Boolean);
      const emails = watchEmails.map((e) => e.email).filter(Boolean);
      if (phones.length === 0 && emails.length === 0) return Promise.resolve(null);
      return clientsApi.checkDuplicates(phones, emails);
    },
    onSuccess: (result) => {
      if (result?.found) {
        setDuplicateResult(result);
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateClientForm) => clientsApi.create(data),
    onSuccess: (client) => {
      toast.success("Client created!");
      qc.invalidateQueries({ queryKey: ["clients"] });
      router.push(`/dashboard/clients/${client.id}`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to create client");
    },
  });

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data as CreateClientForm);
  };

  const togglePestIssue = (id: string) => {
    const current = watch("pest_issues");
    if (current.includes(id)) {
      setValue("pest_issues", current.filter((v) => v !== id));
    } else {
      setValue("pest_issues", [...current, id]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">New Client</h1>
        <p className="text-sm text-gray-500 mt-0.5">Complete required fields and save.</p>
      </div>

      {duplicateResult && (
        <DuplicateAlert
          result={duplicateResult}
          onDismiss={() => setDuplicateResult(null)}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Row 1: Identity ─────────────────────────────── */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Client Identity</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="field-label">Client Name <span className="text-gray-400 font-normal">(optional)</span></label>
              <input className="input-base" placeholder="Full name or company" {...register("client_name")} />
            </div>
            <div>
              <label className="field-label">Client Type *</label>
              <select className="input-base" {...register("client_type")}>
                <option value="new">New</option>
                <option value="existing">Existing</option>
                <option value="recurrent">Recurrent</option>
                <option value="spam">Spam</option>
              </select>
            </div>
            <div>
              <label className="field-label">Property Type *</label>
              <select className="input-base" {...register("property_type")}>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── SECCIÓN COMERCIAL (BLOQUE 3) ────────────────────────── */}
        {watchPropertyType === "commercial" && (
          <div className="card p-5 border-l-4 border-blue-500 bg-blue-50/30">
            <h2 className="text-sm font-bold text-blue-700 mb-4 uppercase tracking-wider flex items-center gap-2">
              <ArrowRight className="h-4 w-4" /> Commercial Lead Requirements
            </h2>
            <div className="grid grid-cols-2 gap-4">
              
              {/* Selector de Inspector (Obligatorio para Commercial) */}
              <div className="col-span-2 md:col-span-1">
                <label className="field-label font-bold text-blue-900">Assigned Inspector *</label>
                <select 
                  className={clsx("input-base", errors.inspector_id && "border-red-500")}
                  {...register("inspector_id")}
                >
                  <option value="">Select Inspector...</option>
                  {users
                    .filter((u) => u.is_inspector)
                    .map((u) => (
                      <option key={u.id} value={u.id}>{u.full_name}</option>
                    ))}
                </select>
                {errors.inspector_id && <p className="mt-1 text-[10px] text-red-500 font-bold">Required for commercial leads</p>}
              </div>

              {/* Selector de Staff Member (Solo si el método de contacto es Staff) */}
              {selectedContactMethod?.name === "Referred by Staff member (please mention the technician)" && (
                <div className="col-span-2 md:col-span-1 animate-in fade-in slide-in-from-top-1">
                  <label className="field-label font-bold text-blue-900">Referring Staff Member *</label>
                  <select 
                    className={clsx("input-base", errors.crew_member_id && "border-red-500")}
                    {...register("crew_member_id")}
                  >
                    <option value="">Choose Technician...</option>
                    {crewMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>
                  {errors.crew_member_id && <p className="mt-1 text-[10px] text-red-500 font-bold">Please select the staff member</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Row 2: Contact ──────────────────────────────── */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Contact Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Contact Date *</label>
              <input type="date" className="input-base" {...register("client_contact_date")} />
              {errors.client_contact_date && (
                <p className="mt-1 text-xs text-red-500">{errors.client_contact_date.message}</p>
              )}
            </div>
            <div>
              <label className="field-label">Contact Method *</label>
              <select className="input-base" {...register("contact_method_id")}>
                <option value="">Select method</option>
                {contactMethods.filter((m) => m.is_active).map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              {errors.contact_method_id && (
                <p className="mt-1 text-xs text-red-500">Required</p>
              )}
            </div>

            {/* Phones */}
            <div className="col-span-2">
              <label className="field-label">
                Phone Numbers
                {phoneRequired && <span className="text-red-500 ml-1">* Required for this contact method</span>}
              </label>
              {phoneFields.map((field, i) => (
                <div key={field.id} className="flex items-center gap-2 mb-2">
                  <input
                    className="input-base flex-1"
                    placeholder="+1 (555) 000-0000"
                    {...register(`phones.${i}.phone_number`)}
                    onBlur={() => dupCheckMutation.mutate()}
                  />
                  <input
                    className="input-base w-24"
                    placeholder="label"
                    {...register(`phones.${i}.label`)}
                  />
                  <button type="button" onClick={() => removePhone(i)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addPhone({ phone_number: "", label: "primary" })}
                className="text-xs text-phantom-600 hover:text-phantom-700 flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add phone
              </button>
            </div>

            {/* Emails */}
            <div className="col-span-2">
              <label className="field-label">
                Email Addresses
                {emailRequired && <span className="text-red-500 ml-1">* Required for this contact method</span>}
              </label>
              {emailFields.map((field, i) => (
                <div key={field.id} className="flex items-center gap-2 mb-2">
                  <input
                    className="input-base flex-1"
                    placeholder="email@example.com"
                    type="email"
                    {...register(`emails.${i}.email`)}
                    onBlur={() => dupCheckMutation.mutate()}
                  />
                  <input
                    className="input-base w-24"
                    placeholder="label"
                    {...register(`emails.${i}.label`)}
                  />
                  <button type="button" onClick={() => removeEmail(i)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addEmail({ email: "", label: "primary" })}
                className="text-xs text-phantom-600 hover:text-phantom-700 flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add email
              </button>
            </div>
          </div>
        </div>

        {/* ── Row 3: Location + Problem ───────────────────── */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Location & Problem</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Location Type</label>
              <select className="input-base" {...register("location_type")}>
                <option value="address">Address</option>
                <option value="city">City</option>
              </select>
            </div>
            <div>
              <label className="field-label">Location Value</label>
              <PhotonAddressInput
                  onChange={(val) => setValue("location_value", val)}
                  placeholder="Ex: 1234 Main St, Vancouver"
                />
                <input type="hidden" {...register("location_value", { required: true })}
              />
            </div>
            <div className="col-span-2">
              <label className="field-label">Problem Description</label>
              <textarea
                className="input-base resize-none"
                rows={3}
                placeholder="Describe the pest issue in detail…"
                {...register("problem_description")}
              />
            </div>
          </div>
        </div>

        {/* ── Row 4: Pest Issues ──────────────────────────── */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Pest Issues</h2>
          <div className="flex flex-wrap gap-2">
            {pestIssues.filter((p) => p.is_active).map((pi) => {
              const selected = watch("pest_issues").includes(pi.id);
              return (
                <button
                  key={pi.id}
                  type="button"
                  onClick={() => togglePestIssue(pi.id)}
                  className={clsx(
                    "rounded-full px-3 py-1 text-xs font-medium border transition-colors capitalize",
                    selected
                      ? "bg-phantom-600 text-white border-phantom-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-phantom-400"
                  )}
                >
                  {pi.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Row 5: Status + Flags ───────────────────────── */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Status & Flags</h2>

          {watchPropertyType === "commercial" ? (
            <div className="relative">
              <select 
                className="input-base bg-gray-100 text-gray-500 cursor-not-allowed appearance-none" 
                value="blue" // Forzamos a "blue" (Assigned) visualmente
                disabled
              >
                <option value="blue">Assigned (Commercial Default)</option>
              </select>
              <div className="absolute right-3 top-2.5">
                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">LOCKED</span>
              </div>
              {/* Input oculto para que el form envíe el valor correcto */}
              <input type="hidden" {...register("status")} value="blue" />
            </div>
          ):(
            <select className="input-base" {...register("status")}>
            <option value="blue">Blue — Initial</option>
            <option value="white">White — Contacted</option>
            <option value="yellow">Yellow — In Progress</option>
            <option value="purple">Purple — Potential</option>
            <option value="green">Green — Sold</option>
            <option value="red">Red — Not Sold</option>
          </select>
          )}
          <div className="grid grid-cols-2 gap-4">
            {/* <div>
              <label className="field-label">Status</label>
              <select className="input-base" {...register("status")}>
                <option value="blue">Blue — Initial</option>
                <option value="white">White — Contacted</option>
                <option value="yellow">Yellow — In Progress</option>
                <option value="purple">Purple — Potential</option>
                <option value="green">Green — Sold</option>
                <option value="red">Red — Not Sold</option>
              </select>
            </div> */}
            <div className="flex items-center gap-3 pt-5">
              <input
                type="checkbox"
                id="after_hours"
                className="h-4 w-4 rounded border-gray-300 text-phantom-600 focus:ring-phantom-500"
                {...register("after_hours")}
              />
              <label htmlFor="after_hours" className="text-sm font-medium text-gray-700 cursor-pointer">
                After Hours
              </label>
            </div>

            {/* Sold fields - only show when status = green */}
            {watchStatus === "green" && (
              <>
                <div>
                  <label className="field-label">Sold Date *</label>
                  <input type="date" className="input-base" max={getLocalToday()} {...register("sold_date")} />
                </div>
                <div>
                  <label className="field-label">Sale Range</label>
                  <input
                    className="input-base"
                    placeholder="e.g. $100–$300"
                    {...register("sale_range")}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary"
          >
            {createMutation.isPending ? (
              <>
                <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                Saving…
              </>
            ) : (
              <>Save Client <ArrowRight className="h-3.5 w-3.5" /></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
