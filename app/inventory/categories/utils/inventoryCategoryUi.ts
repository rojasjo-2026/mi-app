import type { InventoryCategory } from "../types";

export type InventoryCategoryTreeItem = InventoryCategory & {
  depth: number;
  path: string[];
};

function compareCategories(
  first: InventoryCategory,
  second: InventoryCategory,
) {
  if (first.sort_order !== second.sort_order) {
    return first.sort_order - second.sort_order;
  }

  return first.name.localeCompare(second.name, "es", {
    sensitivity: "base",
  });
}

export function buildInventoryCategoryTree(
  categories: InventoryCategory[],
): InventoryCategoryTreeItem[] {
  const categoriesById = new Map(
    categories.map((category) => [category.inventory_category_id, category]),
  );

  const childrenByParent = new Map<string, InventoryCategory[]>();

  const roots: InventoryCategory[] = [];

  for (const category of categories) {
    const parentId = category.parent_category_id;

    if (!parentId || !categoriesById.has(parentId)) {
      roots.push(category);
      continue;
    }

    const currentChildren = childrenByParent.get(parentId) || [];

    currentChildren.push(category);
    childrenByParent.set(parentId, currentChildren);
  }

  roots.sort(compareCategories);

  for (const children of childrenByParent.values()) {
    children.sort(compareCategories);
  }

  const result: InventoryCategoryTreeItem[] = [];

  const visited = new Set<string>();

  function visitCategory(
    category: InventoryCategory,
    depth: number,
    parentPath: string[],
  ) {
    if (visited.has(category.inventory_category_id)) {
      return;
    }

    visited.add(category.inventory_category_id);

    const path = [...parentPath, category.name];

    result.push({
      ...category,
      depth,
      path,
    });

    const children = childrenByParent.get(category.inventory_category_id) || [];

    for (const child of children) {
      visitCategory(child, depth + 1, path);
    }
  }

  for (const root of roots) {
    visitCategory(root, 0, []);
  }

  const remainingCategories = categories
    .filter((category) => !visited.has(category.inventory_category_id))
    .sort(compareCategories);

  for (const category of remainingCategories) {
    visitCategory(category, 0, []);
  }

  return result;
}

export function formatInventoryCategoryDateTime(
  value: string | null | undefined,
  locale: string,
) {
  if (!value) {
    return "No registrado";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No registrado";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function getInventoryCategoryStatusLabel(category: InventoryCategory) {
  return category.is_active ? "Activa" : "Inactiva";
}

export function getInventoryCategoryStatusClass(category: InventoryCategory) {
  return category.is_active
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-100 text-slate-500";
}

export function getInventoryCategoryCodeLabel(category: InventoryCategory) {
  return category.category_code || "Sin código";
}

export function getInventoryCategoryParentLabel(category: InventoryCategory) {
  return category.parent?.name || "Categoría principal";
}

export function getInventoryCategoryLevelLabel(category: InventoryCategory) {
  return category.parent_category_id ? "Subcategoría" : "Categoría principal";
}

export function getInventoryCategoryProductsLabel(productCount: number) {
  return productCount === 1 ? "1 producto" : `${productCount} productos`;
}

export function getInventoryCategoryChildrenLabel(childrenCount: number) {
  return childrenCount === 1
    ? "1 subcategoría"
    : `${childrenCount} subcategorías`;
}

export function getInventoryCategoryPathLabel(
  category: InventoryCategoryTreeItem,
) {
  return category.path.join(" / ");
}
