export type InventoryCategoryFilters = {
  search?: string;
  activeOnly: boolean;
  parentCategoryId?: string;
  rootOnly: boolean;
};

export type InventoryCategoryCreateData = {
  category_code: string | null;
  name: string;
  description: string | null;
  parent_category_id: string | null;
  sort_order: number;
};

export type InventoryCategoryUpdateData =
  Partial<InventoryCategoryCreateData> & {
    is_active?: boolean;
  };

export type InventoryCategorySummary = {
  inventory_category_id: string;
  category_code: string | null;
  name: string;
  is_active: boolean;
};

export type InventoryCategoryResponse = {
  inventory_category_id: string;
  parent_category_id: string | null;
  category_code: string | null;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  parent: InventoryCategorySummary | null;
  children_count: number;
  products_count: number;
  created_at: string;
  updated_at: string;
};

export type InventoryCategoryDetailResponse = InventoryCategoryResponse & {
  children: InventoryCategorySummary[];
};

export type InventoryCategoryBaseRecord = {
  inventory_category_id: string;
  parent_category_id: string | null;
  category_code: string | null;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type InventoryCategoryRelationRecord = {
  inventory_category_id: string;
  category_code: string | null;
  name: string;
  is_active: boolean;
};

export type InventoryCategoryListRecord = InventoryCategoryBaseRecord & {
  parent: InventoryCategoryRelationRecord | null;
  _count: {
    children: number;
    products: number;
  };
};

export type InventoryCategoryDetailRecord = InventoryCategoryListRecord & {
  children: InventoryCategoryRelationRecord[];
};

export type InventoryCategoryParentLink = {
  inventory_category_id: string;
  parent_category_id: string | null;
  is_active: boolean;
};
