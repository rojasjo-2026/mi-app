import { findInventoryCategoryParentLinkById } from "./inventoryCategory.repository";

export async function wouldCreateInventoryCategoryCycle(
  inventoryCategoryId: string,
  proposedParentCategoryId: string,
) {
  let currentCategoryId: string | null = proposedParentCategoryId;
  const visitedCategoryIds = new Set<string>();

  while (currentCategoryId) {
    if (currentCategoryId === inventoryCategoryId) {
      return true;
    }

    if (visitedCategoryIds.has(currentCategoryId)) {
      return true;
    }

    visitedCategoryIds.add(currentCategoryId);

    const category =
      await findInventoryCategoryParentLinkById(currentCategoryId);

    if (!category) {
      return false;
    }

    currentCategoryId = category.parent_category_id;
  }

  return false;
}
