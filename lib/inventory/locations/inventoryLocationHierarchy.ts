import { findInventoryLocationParentLinkById } from "./inventoryLocation.repository";

export async function wouldCreateInventoryLocationCycle(
  inventoryLocationId: string,
  proposedParentLocationId: string,
) {
  let currentLocationId: string | null = proposedParentLocationId;
  const visitedLocationIds = new Set<string>();

  while (currentLocationId) {
    if (currentLocationId === inventoryLocationId) {
      return true;
    }

    if (visitedLocationIds.has(currentLocationId)) {
      return true;
    }

    visitedLocationIds.add(currentLocationId);

    const location =
      await findInventoryLocationParentLinkById(currentLocationId);

    if (!location) {
      return false;
    }

    currentLocationId = location.parent_location_id;
  }

  return false;
}
