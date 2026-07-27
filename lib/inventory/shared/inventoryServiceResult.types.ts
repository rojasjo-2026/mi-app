export type InventoryFieldErrors = Record<string, string>;

export type InventoryServiceBody<T> = {
  success: boolean;
  data?: T;
  message?: string;
  errors?: InventoryFieldErrors;
};

export type InventoryServiceResult<T> = {
  status: number;
  body: InventoryServiceBody<T>;
};
