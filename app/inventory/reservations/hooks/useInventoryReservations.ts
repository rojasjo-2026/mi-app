"use client";

import { useEffect, useState } from "react";

import type {
  InventoryApiResponse,
  InventoryReservationFilters,
  InventoryReservationListData,
} from "../types";

const EMPTY_LIST_DATA: InventoryReservationListData = {
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

function appendSortParameters(
  searchParams: URLSearchParams,
  sort: InventoryReservationFilters["sort"],
) {
  switch (sort) {
    case "created_desc":
      searchParams.set("sort_by", "created_at");
      searchParams.set("sort_direction", "desc");
      return;

    case "created_asc":
      searchParams.set("sort_by", "created_at");
      searchParams.set("sort_direction", "asc");
      return;

    case "expires_asc":
      searchParams.set("sort_by", "expires_at");
      searchParams.set("sort_direction", "asc");
      return;

    case "reservation_asc":
      searchParams.set("sort_by", "reservation_number");
      searchParams.set("sort_direction", "asc");
      return;

    default:
      searchParams.set("sort_by", "updated_at");
      searchParams.set("sort_direction", "desc");
  }
}

type UseInventoryReservationsParameters = {
  search: string;
  filters: InventoryReservationFilters;
  page: number;
  refreshKey: number;
};

export function useInventoryReservations({
  search,
  filters,
  page,
  refreshKey,
}: UseInventoryReservationsParameters) {
  const [data, setData] =
    useState<InventoryReservationListData>(EMPTY_LIST_DATA);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadReservations() {
      try {
        setLoading(true);
        setError("");

        const searchParams = new URLSearchParams({
          page: String(page),
          page_size: String(filters.pageSize),
          expiration_status: filters.expiration,
          expiring_within_days: "7",
        });

        const cleanSearch = search.trim();

        if (cleanSearch) {
          searchParams.set("search", cleanSearch);
        }

        if (filters.status !== "ALL") {
          searchParams.set("status", filters.status);
        }

        appendSortParameters(searchParams, filters.sort);

        const response = await fetch(
          `/api/inventory/reservations?${searchParams.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result: InventoryApiResponse<InventoryReservationListData> =
          await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.message || "No se pudieron cargar las reservas.",
          );
        }

        setData(result.data);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Ocurrio un error al cargar las reservas.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadReservations();

    return () => {
      controller.abort();
    };
  }, [
    filters.expiration,
    filters.pageSize,
    filters.sort,
    filters.status,
    page,
    refreshKey,
    search,
  ]);

  return {
    data,
    loading,
    error,
    initialLoading: loading && data.items.length === 0,
  };
}
