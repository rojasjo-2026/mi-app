import type { InventoryLocation, InventoryLocationType } from "../types";

export type InventoryLocationTreeItem = InventoryLocation & {
  depth: number;
  path: string[];
};

export const INVENTORY_LOCATION_TYPE_OPTIONS: Array<{
  value: InventoryLocationType;
  label: string;
}> = [
  {
    value: "WAREHOUSE",
    label: "Almacén",
  },
  {
    value: "STORAGE_AREA",
    label: "Área de almacenamiento",
  },
  {
    value: "BRANCH",
    label: "Sucursal",
  },
  {
    value: "WORKSHOP",
    label: "Taller",
  },
  {
    value: "VEHICLE",
    label: "Vehículo",
  },
  {
    value: "STAFF",
    label: "Personal",
  },
  {
    value: "IN_TRANSIT",
    label: "En tránsito",
  },
  {
    value: "REPAIR",
    label: "Reparación",
  },
  {
    value: "DAMAGED",
    label: "Producto dañado",
  },
  {
    value: "VIRTUAL",
    label: "Ubicación virtual",
  },
];

const LOCATION_TYPE_LABELS = new Map<InventoryLocationType, string>(
  INVENTORY_LOCATION_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);

function compareInventoryLocations(
  first: InventoryLocation,
  second: InventoryLocation,
) {
  if (first.sort_order !== second.sort_order) {
    return first.sort_order - second.sort_order;
  }

  return first.name.localeCompare(second.name, "es", {
    sensitivity: "base",
  });
}

export function buildInventoryLocationTree(
  locations: InventoryLocation[],
): InventoryLocationTreeItem[] {
  const locationsById = new Map(
    locations.map((location) => [location.inventory_location_id, location]),
  );

  const childrenByParent = new Map<string, InventoryLocation[]>();

  const roots: InventoryLocation[] = [];

  for (const location of locations) {
    const parentId = location.parent_location_id;

    if (!parentId || !locationsById.has(parentId)) {
      roots.push(location);
      continue;
    }

    const children = childrenByParent.get(parentId) || [];

    children.push(location);

    childrenByParent.set(parentId, children);
  }

  roots.sort(compareInventoryLocations);

  for (const children of childrenByParent.values()) {
    children.sort(compareInventoryLocations);
  }

  const result: InventoryLocationTreeItem[] = [];

  const visited = new Set<string>();

  function visitLocation(
    location: InventoryLocation,
    depth: number,
    parentPath: string[],
  ) {
    if (visited.has(location.inventory_location_id)) {
      return;
    }

    visited.add(location.inventory_location_id);

    const path = [...parentPath, location.name];

    result.push({
      ...location,
      depth,
      path,
    });

    const children = childrenByParent.get(location.inventory_location_id) || [];

    for (const child of children) {
      visitLocation(child, depth + 1, path);
    }
  }

  for (const root of roots) {
    visitLocation(root, 0, []);
  }

  const remaining = locations
    .filter((location) => !visited.has(location.inventory_location_id))
    .sort(compareInventoryLocations);

  for (const location of remaining) {
    visitLocation(location, 0, []);
  }

  return result;
}

export function formatInventoryLocationDateTime(
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

export function getInventoryLocationTypeLabel(
  locationType: InventoryLocationType,
) {
  return LOCATION_TYPE_LABELS.get(locationType) || locationType;
}

export function getInventoryLocationStatusLabel(location: InventoryLocation) {
  return location.is_active ? "Activa" : "Inactiva";
}

export function getInventoryLocationStatusClass(location: InventoryLocation) {
  return location.is_active
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-100 text-slate-500";
}

export function getInventoryLocationStockLabel(location: InventoryLocation) {
  return location.allows_stock
    ? "Permite existencias"
    : "No almacena existencias";
}

export function getInventoryLocationDefaultLabel(location: InventoryLocation) {
  return location.is_default ? "Predeterminada" : "No predeterminada";
}

export function getInventoryLocationParentLabel(location: InventoryLocation) {
  return location.parent?.name || "Ubicación principal";
}

export function getInventoryLocationLevelLabel(location: InventoryLocation) {
  return location.parent_location_id
    ? "Ubicación secundaria"
    : "Ubicación principal";
}

export function getInventoryLocationChildrenLabel(childrenCount: number) {
  return childrenCount === 1
    ? "1 ubicación secundaria"
    : `${childrenCount} ubicaciones secundarias`;
}

export function getInventoryLocationBalancesLabel(balancesCount: number) {
  return balancesCount === 1 ? "1 balance" : `${balancesCount} balances`;
}

export function getInventoryLocationAddressLabel(location: InventoryLocation) {
  const parts = [location.address_line, location.reference_point].filter(
    Boolean,
  );

  return parts.length > 0 ? parts.join(" · ") : "Sin dirección";
}

export function getInventoryLocationCoordinatesLabel(
  location: InventoryLocation,
) {
  if (!location.latitude || !location.longitude) {
    return "Sin coordenadas";
  }

  return `${location.latitude}, ${location.longitude}`;
}

export function getInventoryLocationCountryLabel(location: InventoryLocation) {
  return location.country_code || "Sin país";
}

export function getInventoryLocationPathLabel(
  location: InventoryLocationTreeItem,
) {
  return location.path.join(" / ");
}
