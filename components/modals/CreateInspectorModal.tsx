"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import { commercialApi } from "@/services/api";

// Esquema de validación para el inspector
const schema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateInspectorModal({ onClose, onSuccess }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      email: "",
    },
  });

  const mutation = useMutation({
  mutationFn: (data: FormValues) => 
    commercialApi.createExternalInspector(data), // Usando tu service
  onSuccess: () => {
    toast.success("External inspector created");
    onSuccess();
  },
  onError: (err: any) => {
    // Manejo de errores consistente con tu sistema
    toast.error(err?.response?.data?.error || "Failed to create inspector");
  },
});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop con el mismo estilo que FollowUpModal */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Container del Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl animate-slide-in">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Add External Inspector</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit((d) => mutation.mutate(d))}
          className="p-5 space-y-4"
        >
          <p className="text-sm text-gray-500">
            This person will be available for commercial assignments but won't have dashboard access.
          </p>

          <div>
            <label className="field-label">Full Name *</label>
            <input 
              type="text" 
              className="input-base" 
              placeholder="e.g. Mike Contractor"
              {...register("full_name")} 
            />
            {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>}
          </div>

          <div>
            <label className="field-label">Email Address *</label>
            <input 
              type="email" 
              className="input-base" 
              placeholder="mike@example.com"
              {...register("email")} 
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary"
            >
              {mutation.isPending ? "Creating…" : "Create Inspector"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}