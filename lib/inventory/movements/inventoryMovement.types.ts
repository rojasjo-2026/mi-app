import type {
  InventoryDocument,
  InventoryLocation,
  InventoryMovement,
  InventoryProduct,
  Prisma,
} from "@prisma/client";

export type InventoryMovementFilters = {
  inventoryLocationId?: string;
  inventoryProductVariantId?: string;
  inventoryProductId?: string;
  inventoryDocumentId?: string;
  movementType?: InventoryMovement["movement_type"];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
};

export type InventoryMovementQuery = {
  filters: InventoryMovementFilters;
  page: number;
  pageSize: number;
};

export type InventoryMovementDocumentResponse = {
  inventory_document_id: string;
  reversal_of_document_id: string | null;
  document_number: string;
  document_type: InventoryDocument["document_type"];
  status: InventoryDocument["status"];
  document_date: string;
  reference_number: string | null;
};

export type InventoryMovementDocumentLineResponse = {
  inventory_document_line_id: string;
  line_number: number;
};

export type InventoryMovementProductResponse = {
  inventory_product_id: string;
  name: string;
  product_type: InventoryProduct["product_type"];
  tracking_mode: InventoryProduct["tracking_mode"];
  manages_stock: boolean;
  allow_negative_stock: boolean;
  is_active: boolean;
};

export type InventoryMovementVariantResponse = {
  inventory_product_variant_id: string;
  inventory_product_id: string;
  stock_unit_id: string;
  name: string | null;
  is_default: boolean;
  is_active: boolean;
};

export type InventoryMovementUnitResponse = {
  unit_of_measure_id: string;
  code: string;
  name: string;
  symbol: string | null;
  allows_decimal: boolean;
  decimal_scale: number;
  is_active: boolean;
};

export type InventoryMovementLocationResponse = {
  inventory_location_id: string;
  location_code: string;
  name: string;
  location_type: InventoryLocation["location_type"];
  allows_stock: boolean;
  is_active: boolean;
};

export type InventoryMovementLinkResponse = {
  inventory_movement_id: string;
  posting_key: string;
  movement_type: InventoryMovement["movement_type"];
  movement_at: string;
};

export type InventoryMovementResponse = {
  inventory_movement_id: string;
  reversal_of_movement_id: string | null;
  reversal_movement_id: string | null;

  inventory_document_id: string;
  inventory_document_line_id: string;
  inventory_product_variant_id: string;
  inventory_location_id: string;

  posting_key: string;
  movement_type: InventoryMovement["movement_type"];

  quantity_delta: string;
  quantity_in: string;
  quantity_out: string;

  unit_cost: string;

  total_cost_delta: string;
  value_in: string;
  value_out: string;

  movement_at: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;

  document: InventoryMovementDocumentResponse;
  document_line: InventoryMovementDocumentLineResponse;
  product: InventoryMovementProductResponse;
  variant: InventoryMovementVariantResponse;
  stock_unit: InventoryMovementUnitResponse;
  location: InventoryMovementLocationResponse;

  reversal_of_movement: InventoryMovementLinkResponse | null;
  reversal_movement: InventoryMovementLinkResponse | null;
};

export type InventoryMovementPaginationResponse = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_previous_page: boolean;
  has_next_page: boolean;
};

export type InventoryMovementListResponse = {
  items: InventoryMovementResponse[];
  pagination: InventoryMovementPaginationResponse;
};

export type InventoryMovementRecord = Prisma.InventoryMovementGetPayload<{
  include: {
    document: true;

    document_line: {
      select: {
        inventory_document_line_id: true;
        line_number: true;
      };
    };

    variant: {
      include: {
        product: true;
        stock_unit: true;
      };
    };

    location: true;

    reversal_of_movement: {
      select: {
        inventory_movement_id: true;
        posting_key: true;
        movement_type: true;
        movement_at: true;
      };
    };

    reversal_movement: {
      select: {
        inventory_movement_id: true;
        posting_key: true;
        movement_type: true;
        movement_at: true;
      };
    };
  };
}>;
