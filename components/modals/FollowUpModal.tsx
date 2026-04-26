"use client";

import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { followUpsApi } from "@/services/api";
import type { CreateFollowUpForm, FollowUp } from "@/utils/types";
import toast from "react-hot-toast";
import { X } from "lucide-react";

const schema = z.object({
  date: z.string().min(1, "Date is required"),
  type: z.enum(["inbound", "outbound", "sold"]),
  description: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  clientId: string;
  followUp?: FollowUp | null;// Nueva prop para editar
  onClose: () => void;
  onSuccess: () => void;
}

export function FollowUpModal({ clientId, followUp , onClose, onSuccess }: Props) {
  const isEditing = !!followUp;
  const getLocalToday = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split("T")[0];
  };
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: getLocalToday(), 
      type: "inbound",
      description: "",
    },
  });

  useEffect(() => {
    if (followUp) {
      reset({
        date: followUp.date.split("T")[0], // Aseguramos formato YYYY-MM-DD
        type: followUp.type,
        description: followUp.description || "",
      });
    } else {
      reset({
        date: getLocalToday(),
        type: "inbound",
        description: "",
      });
    }
  }, [followUp, reset]);

  // const mutation = useMutation({
  //   mutationFn: (data: FormValues) =>
  //     followUpsApi.create({ ...data, client_id: clientId } as CreateFollowUpForm),
  //   onSuccess: () => {
  //     toast.success("Follow-up added");
  //     onSuccess();
  //   },
  //   onError: (err: any) => {
  //     toast.error(err?.response?.data?.error || "Failed to add follow-up");
  //   },
  // });
  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      if (isEditing && followUp) {
        return followUpsApi.update(followUp.id, data);
      }
      return followUpsApi.create({ ...data, client_id: clientId } as CreateFollowUpForm);
    },
    onSuccess: () => {
      toast.success(isEditing ? "Follow-up updated" : "Follow-up added");
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "An error occurred");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl animate-slide-in">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Add Follow-up</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit((d) => mutation.mutate(d))}
          className="p-5 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Date *</label>
              <input type="date" className="input-base" {...register("date")} />
              {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>}
            </div>
            <div>
              <label className="field-label">Type *</label>
              <select className="input-base" {...register("type")}>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </select>
            </div>
          </div>

          <div>
            <label className="field-label">Description</label>
            <textarea
              className="input-base resize-none"
              rows={4}
              placeholder="What happened during this interaction?"
              {...register("description")}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary"
            >
              {mutation.isPending ? "Saving…" : isEditing ? "Update Changes" : "Save Follow-up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
