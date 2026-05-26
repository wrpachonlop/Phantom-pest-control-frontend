import { commercialApi } from "@/services/api";
import { COMMERCIAL_TRANSITIONS } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import React from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface FollowUpFormProps {
  currentWorkflowStatus: string; // Ej: "assigned"
  clientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FollowUpInputs {
  next_status: string;
  proposal_drive_link: string;
  next_followup_date: string;
  notes: string;

  // Campos de negocio obligatorios para APPROVED
  company_name: string;
  contact_person_name: string;
  billing_address: string;
  service_address: string;
  same_as_service: boolean;
  billing_terms: "on_completion" | "credit_card_on_file" | "net_15" | "net_30" | "net_60";

	// Campos de aprobación y costos
  approved_by_name: string;
  approved_date: string;
  initial_setup_cost: number;
  recurring_service_cost: number;
  service_frequency: "daily" | "weekly" | "monthly" | "bi_monthly" | "quarterly" | "tri_annual" | "semi_annual" | "seasonal" | "yearly";
  frequency_interval?: number;
}

export const CommercialFollowUpModal: React.FC<FollowUpFormProps> = ({
  currentWorkflowStatus,
  clientId,
  onClose,
  onSuccess,
}) => {
  // Obtenemos las opciones válidas para el estado actual
  const allowedNextStatuses = COMMERCIAL_TRANSITIONS[currentWorkflowStatus] || [];

  const {
    register,
    watch,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FollowUpInputs>({
    defaultValues: {
      next_status: allowedNextStatuses[0] || "",
    },
  });
  const qc = useQueryClient();

  const commercialTransitionMutation = useMutation({
    mutationFn: ({ clientId, payload }: { clientId: string; payload: any }) =>
      commercialApi.transitionWorkflow(clientId, payload), // <--- ¡Llamada ultra limpia!
    onSuccess: () => {
      toast.success("Commercial stage updated successfully");
      qc.invalidateQueries({ queryKey: ["follow-ups", clientId] });
      qc.invalidateQueries({ queryKey: ["client", clientId] });
      onClose();
    },
    onError: (error: any) => {
      console.error("Workflow transition failed:", error);
      toast.error(error.response?.data?.error || "Failed to update commercial stage");
    }
  });

  const selectedStatus = watch("next_status");
  const showFullBusinessForm = selectedStatus === "approved";
  const selectedFrequency = watch("service_frequency");

  // Validar si requiere intervalo (Solo para daily, weekly, monthly)
  const requiresInterval = ["daily", "weekly", "monthly"].includes(selectedFrequency);

  const serviceAddressVal = watch("service_address");
  const sameAsServiceVal = watch("same_as_service");

  React.useEffect(() => {
  if (sameAsServiceVal && serviceAddressVal) {
    // Copia el valor de service a billing de forma reactiva
    setValue("billing_address", serviceAddressVal, { shouldValidate: true });
  }
}, [sameAsServiceVal, serviceAddressVal, setValue]);

  // El link de Drive es obligatorio para: pending, approved, declined
  const isDriveLinkRequired = ["pending", "approved", "declined"].includes(selectedStatus);
  // La fecha es obligatoria solo si pasa a PENDING
  const isFollowUpDateRequired = selectedStatus === "pending";

  const onSubmit = async (data: FollowUpInputs) => {
    try {
      // Tu llamada a la API (Ej: axios.post(`/api/v1/clients/${clientId}/workflow`, data))
      // Esto actualizará tanto commercial_client_details como creará el log de interacción.

      const payload = {
        to_status: data.next_status, // <--- Sincronizado con 'to_status' de Go
        proposal_drive_link: data.proposal_drive_link || null,
        next_followup_date: data.next_status === "pending" ? data.next_followup_date : null,
        notes: data.notes || null,

        // Perfil e identidad si el estado cambia a approved
        company_name: data.next_status === "approved" ? data.company_name : null,
        contact_person_name: data.next_status === "approved" ? data.contact_person_name : null,
        service_address: data.next_status === "approved" ? data.service_address : null,
        billing_address: data.next_status === "approved" ? data.billing_address : null,
        billing_same_as_service: data.next_status === "approved" ? data.same_as_service : false,

        // Datos financieros y de aprobación
        approved_by_name: data.next_status === "approved" ? data.approved_by_name : null,
        approved_date: data.next_status === "approved" ? data.approved_date : null,
        initial_setup_cost: data.next_status === "approved" ? Number(data.initial_setup_cost) : null,
        recurring_service_cost: data.next_status === "approved" ? Number(data.recurring_service_cost) : null,
        service_frequency: data.next_status === "approved" ? data.service_frequency : null,
        frequency_interval: data.next_status === "approved" && ["daily", "weekly", "monthly"].includes(data.service_frequency)
          ? Number(data.frequency_interval)
          : null,
        billing_terms: data.next_status === "approved" ? data.billing_terms : null,
      };
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al transicionar el workflow comercial:", error);
    }
  };

  if (allowedNextStatuses.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500">
        This client has reached a terminal stage and no further workflow transitions are allowed.
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Commercial Stage</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Selector de Siguiente Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Next Action / Status *</label>
            <select
              {...register("next_status", { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
            >
              {allowedNextStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Enlace de la Propuesta en Google Drive (Condicional y Obligatorio) */}
          {isDriveLinkRequired && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Proposal Link (Google Docs) *
              </label>
              <input
                type="url"
                placeholder="https://docs.google.com/..."
                {...register("proposal_drive_link", {
                  required: isDriveLinkRequired ? "The proposal link is required for this status" : false,
                  pattern: {
                    value: /docs\.google\.com/,
                    message: "Must be a valid Google Docs link"
                  }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
              />
              {errors.proposal_drive_link && (
                <p className="mt-1 text-xs text-red-600">{errors.proposal_drive_link.message}</p>
              )}
            </div>
          )}
          {showFullBusinessForm && (
            <div className="mt-4 border-t border-gray-200 pt-4 space-y-4">
              <h4 className="text-sm font-medium text-amber-700 bg-amber-50 p-2 rounded">
                Required Commercial & Contract Details
              </h4>

              {/* Sección 1: Datos de la Empresa y Contacto */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Company Name *</label>
                  <input
                    type="text"
                    {...register("company_name", { required: showFullBusinessForm })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Contact Person Name *</label>
                  <input
                    type="text"
                    {...register("contact_person_name", { required: showFullBusinessForm })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                  />
                </div>
              </div>

              {/* Direcciones y Términos */}
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Service Address *</label>
                  <input
                    type="text"
                    {...register("service_address", { required: showFullBusinessForm })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                  />
                </div>
                {/* CHECKBOX: SAME AS SERVICE */}
                <div className="flex items-center">
                  <input
                    id="same_as_service"
                    type="checkbox"
                    {...register("same_as_service")}
                    onChange={(e) => {
                      // Aseguramos que el trigger nativo de react-hook-form y nuestra lógica convivan
                      register("same_as_service").onChange(e);
                      if (e.target.checked && serviceAddressVal) {
                        setValue("billing_address", serviceAddressVal, { shouldValidate: true });
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="same_as_service" className="ml-2 block text-xs text-gray-600 cursor-pointer select-none">
                    Billing address is the same as service address
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">Billing Address *</label>
                  <input
                    type="text"
                    {...register("billing_address", { required: showFullBusinessForm })}
                    placeholder={sameAsServiceVal ? "Same as service address" : "Billing company address"}
                    disabled={sameAsServiceVal} // <--- Bloquea el campo si es idéntico para evitar errores
                    className={clsx(
                      "mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm",
                      sameAsServiceVal && "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200" // Estilo visual de bloqueado
                    )}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Billing Terms *</label>
                  <select
                    {...register("billing_terms", { required: showFullBusinessForm })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                  >
                    <option value="on_completion">On Completion</option>
                    <option value="credit_card_on_file">Credit Card on File</option>
                    <option value="net_15">Net 15</option>
                    <option value="net_30">Net 30</option>
                    <option value="net_60">Net 60</option>
                  </select>
                </div>
              </div>

              {/* Sección 2: Aprobación y Costos Financieros */}
              <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Approved By *</label>
                  <input
                    type="text"
                    {...register("approved_by_name", { required: showFullBusinessForm })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Approved Date *</label>
                  <input
                    type="date"
                    {...register("approved_date", { required: showFullBusinessForm })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Initial Setup Cost ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("initial_setup_cost", { required: showFullBusinessForm, valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Recurring Cost ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("recurring_service_cost", { required: showFullBusinessForm, valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                  />
                </div>
              </div>

              {/* Frecuencias de Servicio e Intervalos Dinámicos */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Service Frequency *</label>
                  <select
                    {...register("service_frequency", { required: showFullBusinessForm })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="bi_monthly">Bi-Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="tri_annual">Tri-Annual</option>
                    <option value="semi_annual">Semi-Annual</option>
                    <option value="seasonal">Seasonal</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                {requiresInterval && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      Every X {selectedFrequency === "daily" ? "Days" : selectedFrequency === "weekly" ? "Weeks" : "Months"} *
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Ex: 2 (every 2 days/weeks/months)"
                      {...register("frequency_interval", { required: requiresInterval, valueAsNumber: true })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Próxima Fecha de Seguimiento (Solo obligatorio para PENDING) */}
          {isFollowUpDateRequired && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Next Follow-up Date *
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]} // No allows past dates
                {...register("next_followup_date", {
                  required: isFollowUpDateRequired ? "You must assign the date of the next contact" : false,
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
              />
              {errors.next_followup_date && (
                <p className="mt-1 text-xs text-red-600">{errors.next_followup_date.message}</p>
              )}
            </div>
          )}

          {/* Notas de la interacción */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Follow-up Notes</label>
            <textarea
              rows={3}
              placeholder="Write your comments or agreements reached with the client..."
              {...register("notes")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
            />
          </div>

          {/* Botonera */}
          <div className="mt-5 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:bg-amber-400"
            >
              {isSubmitting ? "Saving..." : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};