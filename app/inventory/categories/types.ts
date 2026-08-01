export type InventoryApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
};

export type InventoryCategorySummary = {
  inventory_category_id: string;
  category_code: string | null;
  name: string;
  is_active: boolean;
};

export type InventoryCategory = {
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

export type InventoryCategoryDetail = InventoryCategory & {
  children: InventoryCategorySummary[];
};

export type InventoryCategoryFilters = {
  activeOnly: boolean;
  hierarchyMode: "ALL" | "ROOT";
  parentCategoryId: string;
  pageSize: number;
};

export type InventoryCategoryMetricsData = {
  categories: number;
  activeCategories: number;
  rootCategories: number;
  subcategories: number;
  assignedProducts: number;
};

export type InventoryCategoryFormMode = "create" | "edit";

export type InventoryCategoryFormState = {
  categoryCode: string;
  name: string;
  description: string;
  parentCategoryId: string;
  sortOrder: string;
};

export type InventoryCategoryFormErrors = Partial<
  Record<keyof InventoryCategoryFormState, string>
>;
