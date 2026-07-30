"use client";

import { useEffect, useState } from "react";

import type {
  InventoryApiResponse,
  InventoryDocument,
  InventoryDocumentFilters,
  InventoryDocumentListData,
} from "../types";

const EMPTY_LIST_DATA: InventoryDocumentListData = {
  items: [],

  pagination: {
    page: 1,
    page_size: 25,
    total_items: 0,
    total_pages: 0,
    has_previous_page: false,
    has_next_page: false,
  },
};

type InventoryDocumentsResponseData =
  InventoryDocumentListData | InventoryDocument[];

function normalizeInventoryDocumentListData(
  value: InventoryDocumentsResponseData,
): InventoryDocumentListData {
  if (Array.isArray(value)) {
    return {
      items: value,

      pagination: {
        page: 1,
        page_size: Math.max(value.length, 25),
        total_items: value.length,
        total_pages: value.length === 0 ? 0 : 1,
        has_previous_page: false,
        has_next_page: false,
      },
    };
  }

  const items = Array.isArray(value.items) ? value.items : [];

  const pagination = value.pagination ?? EMPTY_LIST_DATA.pagination;

  return {
    items,

    pagination: {
      page: Number.isFinite(pagination.page) ? pagination.page : 1,

      page_size: Number.isFinite(pagination.page_size)
        ? pagination.page_size
        : 25,

      total_items: Number.isFinite(pagination.total_items)
        ? pagination.total_items
        : items.length,

      total_pages: Number.isFinite(pagination.total_pages)
        ? pagination.total_pages
        : items.length === 0
          ? 0
          : 1,

      has_previous_page: Boolean(pagination.has_previous_page),

      has_next_page: Boolean(pagination.has_next_page),
    },
  };
}

type UseInventoryDocumentsParameters = {
  search: string;
  filters: InventoryDocumentFilters;
  page: number;
  refreshKey: number;
};

export function useInventoryDocuments({
  search,
  filters,
  page,
  refreshKey,
}: UseInventoryDocumentsParameters) {
  const [data, setData] = useState<InventoryDocumentListData>(EMPTY_LIST_DATA);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadOperations() {
      try {
        setLoading(true);
        setError("");

        const searchParams = new URLSearchParams({
          page: String(page),
          page_size: String(filters.pageSize),
        });

        const cleanSearch = search.trim();

        if (cleanSearch) {
          searchParams.set("search", cleanSearch);
        }

        if (filters.documentType !== "ALL") {
          searchParams.set("document_type", filters.documentType);
        }

        if (filters.status !== "ALL") {
          searchParams.set("status", filters.status);
        }

        if (filters.dateFrom) {
          searchParams.set("date_from", filters.dateFrom);
        }

        if (filters.dateTo) {
          searchParams.set("date_to", filters.dateTo);
        }

        const response = await fetch(
          `/api/inventory/documents?${searchParams.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result: InventoryApiResponse<InventoryDocumentsResponseData> =
          await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.message ||
              "No se pudieron cargar las operaciones de inventario.",
          );
        }

        setData(normalizeInventoryDocumentListData(result.data));
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Ocurrió un error al cargar las operaciones de inventario.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadOperations();

    return () => {
      controller.abort();
    };
  }, [
    filters.dateFrom,
    filters.dateTo,
    filters.documentType,
    filters.pageSize,
    filters.status,
    page,
    refreshKey,
    search,
  ]);

  const safeData = normalizeInventoryDocumentListData(
    data as InventoryDocumentsResponseData,
  );

  return {
    data: safeData,
    loading,
    error,

    initialLoading: loading && safeData.items.length === 0,
  };
}
