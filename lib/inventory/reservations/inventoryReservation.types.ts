import type {
  InventoryLocation,
  InventoryProduct,
  InventoryProductVariant,
  InventoryReservation,
  InventoryReservationEvent,
  InventoryReservationEventType,
  InventoryReservationLine,
  InventoryReservationStatus,
  Prisma,
} from "@prisma/client";

export type InventoryReservationCreateLineData = {
  inventory_product_variant_id: string;
  inventory_location_id: string;
  quantity_requested: string;
  notes: string | null;
};

export type InventoryReservationCreateData = {
  reference_type: string | null;
  reference_id: string | null;
  reference_number: string | null;
  idempotency_key: string | null;
  expires_at: Date | null;
  notes: string | null;
  created_by: string | null;
  lines: InventoryReservationCreateLineData[];
};

export type InventoryReservationProductRecord = Pick<
  InventoryProduct,
  | "inventory_product_id"
  | "name"
  | "product_type"
  | "tracking_mode"
  | "manages_stock"
  | "is_active"
>;

export type InventoryReservationVariantRecord = Pick<
  InventoryProductVariant,
  | "inventory_product_variant_id"
  | "inventory_product_id"
  | "stock_unit_id"
  | "name"
  | "is_default"
  | "is_active"
> & {
  product: InventoryReservationProductRecord;
};

export type InventoryReservationLocationRecord = Pick<
  InventoryLocation,
  | "inventory_location_id"
  | "location_code"
  | "name"
  | "location_type"
  | "allows_stock"
  | "is_active"
>;

export type InventoryReservationLineRecord = InventoryReservationLine & {
  variant: InventoryReservationVariantRecord;
  location: InventoryReservationLocationRecord;
};

export type InventoryReservationDetailRecord = InventoryReservation & {
  lines: InventoryReservationLineRecord[];
  events: InventoryReservationEvent[];
};

export type InventoryReservationProductSummary = {
  inventory_product_id: string;
  name: string;
  product_type: InventoryProduct["product_type"];
  tracking_mode: InventoryProduct["tracking_mode"];
  manages_stock: boolean;
  is_active: boolean;
};

export type InventoryReservationVariantSummary = {
  inventory_product_variant_id: string;
  inventory_product_id: string;
  stock_unit_id: string;
  name: string | null;
  is_default: boolean;
  is_active: boolean;
  product: InventoryReservationProductSummary;
};

export type InventoryReservationLocationSummary = {
  inventory_location_id: string;
  location_code: string;
  name: string;
  location_type: InventoryLocation["location_type"];
  allows_stock: boolean;
  is_active: boolean;
};

export type InventoryReservationLineResponse = {
  inventory_reservation_line_id: string;
  inventory_reservation_id: string;
  inventory_product_variant_id: string;
  inventory_location_id: string;
  line_number: number;
  quantity_requested: string;
  quantity_reserved: string;
  quantity_consumed: string;
  quantity_released: string;
  notes: string | null;
  variant: InventoryReservationVariantSummary;
  location: InventoryReservationLocationSummary;
  created_at: string;
  updated_at: string;
};

export type InventoryReservationEventResponse = {
  inventory_reservation_event_id: string;
  inventory_reservation_id: string;
  inventory_reservation_line_id: string | null;
  event_type: InventoryReservationEventType;
  previous_status: InventoryReservationStatus | null;
  new_status: InventoryReservationStatus | null;
  quantity: string | null;
  reference_type: string | null;
  reference_id: string | null;
  reference_number: string | null;
  reason: string | null;
  metadata: Prisma.JsonValue;
  created_by: string | null;
  created_at: string;
};

export type InventoryReservationDetailResponse = {
  inventory_reservation_id: string;
  reservation_number: string;
  status: InventoryReservationStatus;
  reference_type: string | null;
  reference_id: string | null;
  reference_number: string | null;
  idempotency_key: string | null;
  expires_at: string | null;
  notes: string | null;
  created_by: string | null;
  activated_by: string | null;
  released_by: string | null;
  expired_by: string | null;
  cancelled_by: string | null;
  activated_at: string | null;
  consumed_at: string | null;
  released_at: string | null;
  expired_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  lines: InventoryReservationLineResponse[];
  events: InventoryReservationEventResponse[];
};
