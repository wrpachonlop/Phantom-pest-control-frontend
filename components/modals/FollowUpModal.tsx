"use client";

import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { followUpsApi } from "@/services/api";
import type { CreateFollowUpForm } from "@/utils/types";
import toast from "react-hot-toast";
import { X } from "lucide-react";

const schema = z.object({
  date: z.string().min(1, "Date is required"),
  type: z.enum(["inbound", "outbound", "sold"]),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  clientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function FollowUpModal({ clientId, onClose, onSuccess }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      type: "inbound",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      followUpsApi.create({ ...data, client_id: clientId } as CreateFollowUpForm),
    onSuccess: () => {
      toast.success("Follow-up added");
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to add follow-up");
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
                <option value="sold">Sold</option>
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
              {mutation.isPending ? "Saving…" : "Save Follow-up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
