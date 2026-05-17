"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClientInvoice } from "@/lib/clients/clientInvoiceFinanceSummary";

type ClientInvoicesResponse = {
  success: boolean;
  data?: ClientInvoice[];
  message?: string;
};

export function useClientInvoices(clientId?: string) {
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadInvoices = useCallback(async () => {
    if (!clientId) {
      setInvoices([]);
      setError("");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `/api/invoices?client_id=${encodeURIComponent(clientId)}`,
        {
          cache: "no-store",
        },
      );

      const result: ClientInvoicesResponse = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to load invoices");
      }

      setInvoices(result.data ?? []);
    } catch {
      setInvoices([]);
      setError("No se pudieron cargar las facturas del cliente");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  return {
    invoices,
    loading,
    error,
    reloadInvoices: loadInvoices,
  };
}
