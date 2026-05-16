"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ClientDetail,
  ClientDetailResponse,
} from "@/lib/clients/clientDetail.types";

export function useClientDetail(id?: string) {
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadClient = useCallback(async () => {
    if (!id) {
      setClient(null);
      setError("Cliente no encontrado");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const clientRes = await fetch(`/api/clients/${id}`, {
        cache: "no-store",
      });

      const clientResult: ClientDetailResponse = await clientRes.json();

      if (!clientRes.ok || !clientResult.success || !clientResult.data) {
        throw new Error(clientResult.message || "Failed to load client");
      }

      setClient(clientResult.data);
    } catch {
      setClient(null);
      setError("No se pudo cargar el cliente");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadClient();
  }, [loadClient]);

  return {
    client,
    setClient,
    loading,
    error,
    reloadClient: loadClient,
  };
}
