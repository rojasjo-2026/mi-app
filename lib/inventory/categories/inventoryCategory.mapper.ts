import type {
  InventoryCategoryDetailRecord,
  InventoryCategoryDetailResponse,
  InventoryCategoryListRecord,
  InventoryCategoryRelationRecord,
  InventoryCategoryResponse,
  InventoryCategorySummary,
} from "./inventoryCategory.types";

function mapInventoryCategorySummary(
  category: InventoryCategoryRelationRecord,
): InventoryCategorySummary {
  return {
    inventory_category_id: category.inventory_category_id,
    category_code: category.category_code,
    name: category.name,
    is_active: category.is_active,
  };
}

export function mapInventoryCategory(
  category: InventoryCategoryListRecord,
): InventoryCategoryResponse {
  return {
    inventory_category_id: category.inventory_category_id,
    parent_category_id: category.parent_category_id,
    category_code: category.category_code,
    name: category.name,
    description: category.description,
    sort_order: category.sort_order,
    is_active: category.is_active,
    parent: category.parent
      ? mapInventoryCategorySummary(category.parent)
      : null,
    children_count: category._count.children,
    products_count: category._count.products,
    created_at: category.created_at.toISOString(),
    updated_at: category.updated_at.toISOString(),
  };
}

export function mapInventoryCategories(
  categories: InventoryCategoryListRecord[],
): InventoryCategoryResponse[] {
  return categories.map(mapInventoryCategory);
}

export function mapInventoryCategoryDetail(
  category: InventoryCategoryDetailRecord,
): InventoryCategoryDetailResponse {
  return {
    ...mapInventoryCategory(category),
    children: category.children.map(mapInventoryCategorySummary),
  };
}
