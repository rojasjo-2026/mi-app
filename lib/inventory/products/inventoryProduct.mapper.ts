import { mapInventoryVariantSummary } from "../variants/inventoryVariant.mapper";

import type {
  InventoryProductCategoryRecord,
  InventoryProductCategorySummary,
  InventoryProductDetailRecord,
  InventoryProductDetailResponse,
  InventoryProductListRecord,
  InventoryProductResponse,
} from "./inventoryProduct.types";

function mapInventoryProductCategory(
  category: InventoryProductCategoryRecord,
): InventoryProductCategorySummary {
  return {
    inventory_category_id: category.inventory_category_id,
    category_code: category.category_code,
    name: category.name,
    is_active: category.is_active,
  };
}

export function mapInventoryProduct(
  product: InventoryProductListRecord,
): InventoryProductResponse {
  return {
    inventory_product_id: product.inventory_product_id,
    inventory_category_id: product.inventory_category_id,
    name: product.name,
    description: product.description,
    brand: product.brand,
    model: product.model,
    product_type: product.product_type,
    tracking_mode: product.tracking_mode,
    manages_stock: product.manages_stock,
    has_expiration: product.has_expiration,
    allow_negative_stock: product.allow_negative_stock,
    tax_exempt: product.tax_exempt,
    tax_rate: product.tax_rate?.toString() ?? null,
    attributes: product.attributes,
    is_active: product.is_active,
    category: product.category
      ? mapInventoryProductCategory(product.category)
      : null,
    variants_count: product._count.variants,
    created_at: product.created_at.toISOString(),
    updated_at: product.updated_at.toISOString(),
  };
}

export function mapInventoryProducts(
  products: InventoryProductListRecord[],
): InventoryProductResponse[] {
  return products.map(mapInventoryProduct);
}

export function mapInventoryProductDetail(
  product: InventoryProductDetailRecord,
): InventoryProductDetailResponse {
  return {
    ...mapInventoryProduct(product),
    variants: product.variants.map(mapInventoryVariantSummary),
  };
}
