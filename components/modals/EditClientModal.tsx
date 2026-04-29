"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm,useFieldArray } from "react-hook-form";
import { clientsApi, contactMethodsApi, pestIssuesApi } from "@/services/api";
import type { ClientFull, ContactMethod, PestIssue } from "@/utils/types";
import toast from "react-hot-toast";
import { X, Plus, Trash2 } from "lucide-react";

interface Props {
  client: ClientFull;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditClientModal({ client, onClose, onSuccess }: Props) {
  const today = new Date().toLocaleDateString("sv-SE");
  const { data: contactMethods = [] } = useQuery<ContactMethod[]>({
    queryKey: ["contact-methods"],
    queryFn: contactMethodsApi.list,
  });

const { register, handleSubmit, watch, control, formState: { errors } } = useForm({
    defaultValues: {
      client_name: client.client_name || "",
      client_type: client.client_type,
      property_type: client.property_type,
      status: client.status,
      client_contact_date: client.client_contact_date?.split("T")[0] || "",
      after_hours: client.after_hours,
      contact_method_id: client.contact_method_id,
      problem_description: client.problem_description || "",
      location_type: client.location_type,
      location_value: client.location_value || "",
      sale_range: client.sale_range || "",
      sold_date: client.sold_date?.split("T")[0] || "",
      // Inicializamos los arrays con los datos actuales del cliente
      phones: client.phones.map(p => ({ phone_number: p.phone_number, label: p.label })),
      emails: client.emails.map(e => ({ email: e.email, label: e.label })),
      pest_issues: client.pest_issues.map(p => p.id),
    },
  });

  const { data: allPests = [] } = useQuery<PestIssue[]>({
    queryKey: ["pest-issues"],
    queryFn: pestIssuesApi.list, // Asegúrate de que esta función exista en tu services/api
  });

  // Controladores para arrays dinámicos
  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
    control,
    name: "phones"
  });

  const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({
    control,
    name: "emails"
  });

  const watchStatus = watch("status");
  const getLocalToday = () => {
  const now = new Date();
    // Ajustamos la fecha restando el offset de la zona horaria local manualmente
    const offset = now.getTimezoneOffset() * 60000; 
    const localISOTime = new Date(now.getTime() - offset).toISOString();
    return localISOTime.split("T")[0]; // Devuelve "YYYY-MM-DD" en tu hora local
  };
  const mutation = useMutation({
    mutationFn: (data: any) => clientsApi.update(client.id, data),
    onSuccess: () => {
      toast.success("Client updated");
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to update client");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl animate-slide-in">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-900">Edit Client</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="field-label">Client Name</label>
              <input className="input-base" {...register("client_name")} />
            </div>

            <div className="col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="field-label">Phones</label>
                <button 
                  type="button" 
                  onClick={() => appendPhone({ phone_number: "", label: "mobile" })}
                  className="text-xs flex items-center gap-1 text-phantom-600 hover:underline"
                >
                  <Plus className="h-3 w-3" /> Add Phone
                </button>
              </div>
              {phoneFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <input 
                    placeholder="Number" 
                    className="input-base flex-1" 
                    {...register(`phones.${index}.phone_number` as const)} 
                  />
                  <select className="input-base w-32" {...register(`phones.${index}.label` as const)}>
                    <option value="mobile">Mobile</option>
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                  </select>
                  <button type="button" onClick={() => removePhone(index)} className="p-2 text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="field-label">Emails</label>
                <button 
                  type="button" 
                  onClick={() => appendEmail({ email: "", label: "personal" })}
                  className="text-xs flex items-center gap-1 text-phantom-600 hover:underline"
                >
                  <Plus className="h-3 w-3" /> Add Email
                </button>
              </div>
              {emailFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <input 
                    placeholder="Email" 
                    className="input-base flex-1" 
                    {...register(`emails.${index}.email` as const)} 
                  />
                  <button type="button" onClick={() => removeEmail(index)} className="p-2 text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="col-span-2">
              <label className="field-label">Pest Issues</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {allPests.map((pest) => (
                  <label key={pest.id} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      value={pest.id}
                      className="rounded border-gray-300 text-phantom-600"
                      {...register("pest_issues")}
                    />
                    <span className="text-xs text-gray-700">{pest.name}</span>
                  </label>
                ))}
              </div>
            </div>


            <div>
              <label className="field-label">Client Type</label>
              <select className="input-base" {...register("client_type")}>
                <option value="new">New</option>
                <option value="existing">Existing</option>
                <option value="recurrent">Recurrent</option>
                <option value="spam">Spam</option>
              </select>
            </div>
            <div>
              <label className="field-label">Property Type</label>
              <select className="input-base" {...register("property_type")}>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            <div>
              <label className="field-label">Status</label>
              <select className="input-base" {...register("status")}>
                <option value="blue">Blue — Initial</option>
                <option value="white">White — Contacted</option>
                <option value="yellow">Yellow — In Progress</option>
                <option value="purple">Purple — Potential</option>
                <option value="green">Green — Sold</option>
                <option value="red">Red — Not Sold</option>
              </select>
            </div>
            <div>
              <label className="field-label">Contact Method</label>
              <select className="input-base" {...register("contact_method_id")}>
                {contactMethods.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Contact Date</label>
              <input type="date" className="input-base" {...register("client_contact_date")} />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <input
                type="checkbox"
                id="edit_after_hours"
                className="h-4 w-4 rounded border-gray-300 text-phantom-600"
                {...register("after_hours")}
              />
              <label htmlFor="edit_after_hours" className="text-sm font-medium text-gray-700">After Hours</label>
            </div>
            <div>
              <label className="field-label">Location Type</label>
              <select className="input-base" {...register("location_type")}>
                <option value="address">Address</option>
                <option value="city">City</option>
              </select>
            </div>
            <div>
              <label className="field-label">Location</label>
              <input className="input-base" {...register("location_value")} />
            </div>

            {watchStatus === "green" && (
              <>
                <div>
                  <label className="field-label">Sold Date *</label>
                  <input type="date" className="input-base" max={getLocalToday()} {...register("sold_date")} />
                </div>
                <div>
                  <label className="field-label">Sale Range</label>
                  <input className="input-base" placeholder="e.g. $100–$300" {...register("sale_range")} />
                </div>
              </>
            )}

            <div className="col-span-2">
              <label className="field-label">Problem Description</label>
              <textarea
                className="input-base resize-none"
                rows={3}
                {...register("problem_description")}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              {mutation.isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
