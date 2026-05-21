import { COMMERCIAL_TRANSITIONS } from "@/utils/types";
import React from "react";
import { useForm } from "react-hook-form";

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
    formState: { errors, isSubmitting },
  } = useForm<FollowUpInputs>({
    defaultValues: {
      next_status: allowedNextStatuses[0] || "",
    },
  });

  const selectedStatus = watch("next_status");

  // El link de Drive es obligatorio para: pending, approved, declined
  const isDriveLinkRequired = ["pending", "approved", "declined"].includes(selectedStatus);
  // La fecha es obligatoria solo si pasa a PENDING
  const isFollowUpDateRequired = selectedStatus === "pending";

  const onSubmit = async (data: FollowUpInputs) => {
    try {
      // Tu llamada a la API (Ej: axios.post(`/api/v1/clients/${clientId}/workflow`, data))
      // Esto actualizará tanto commercial_client_details como creará el log de interacción.
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al transicionar el workflow comercial:", error);
    }
  };

  if (allowedNextStatuses.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500">
        Este cliente se encuentra en un estado terminal y no admite más transiciones de flujo.
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Registrar Seguimiento Comercial</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Selector de Siguiente Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Siguiente Acción / Estado *</label>
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
                Link de la Propuesta (Google Drive) *
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/..."
                {...register("proposal_drive_link", {
                  required: isDriveLinkRequired ? "El enlace de la propuesta es obligatorio para este estado" : false,
                  pattern: {
                    value: /drive\.google\.com/,
                    message: "Debe ser un enlace válido de Google Drive"
                  }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
              />
              {errors.proposal_drive_link && (
                <p className="mt-1 text-xs text-red-600">{errors.proposal_drive_link.message}</p>
              )}
            </div>
          )}

          {/* Próxima Fecha de Seguimiento (Solo obligatorio para PENDING) */}
          {isFollowUpDateRequired && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Próxima Fecha de Follow-up *
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]} // No permite fechas pasadas
                {...register("next_followup_date", {
                  required: isFollowUpDateRequired ? "Debes asignar la fecha del próximo contacto" : false,
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
            <label className="block text-sm font-medium text-gray-700">Notas del Seguimiento</label>
            <textarea
              rows={3}
              placeholder="Escribe aquí los comentarios o acuerdos alcanzados con el cliente..."
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
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:bg-amber-400"
            >
              {isSubmitting ? "Guardando..." : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};