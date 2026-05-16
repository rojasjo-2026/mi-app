"use client";

import { getToastClass } from "@/lib/clients/clientList.utils";

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

type ClientListToastProps = {
  toast: ToastState;
};

export function ClientListToast({ toast }: ClientListToastProps) {
  if (!toast) return null;

  return (
    <div className="fixed right-6 top-6 z-50">
      <div
        className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg ${getToastClass(
          toast.type,
        )}`}
      >
        {toast.message}
      </div>
    </div>
  );
}
