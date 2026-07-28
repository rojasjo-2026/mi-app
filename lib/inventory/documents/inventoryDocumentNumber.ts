import { randomUUID } from "node:crypto";

import type { InventoryDocumentType } from "@prisma/client";

const DOCUMENT_TYPE_PREFIXES: Record<InventoryDocumentType, string> = {
  OPENING_BALANCE: "OPN",
  RECEIPT: "RCV",
  ISSUE: "ISS",
  TRANSFER: "TRF",
  ADJUSTMENT_INCREASE: "ADJIN",
  ADJUSTMENT_DECREASE: "ADJOUT",
  RETURN_IN: "RTNIN",
  RETURN_OUT: "RTNOUT",
};

function formatDatePart(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

export function generateInventoryDocumentNumber(
  documentType: InventoryDocumentType,
  date = new Date(),
) {
  const prefix = DOCUMENT_TYPE_PREFIXES[documentType];

  const uniquePart = randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();

  return ["STK", prefix, formatDatePart(date), date.getTime(), uniquePart].join(
    "-",
  );
}
