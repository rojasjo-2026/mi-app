import { randomUUID } from "node:crypto";

function formatDatePart(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

export function generateInventoryReservationNumber(date = new Date()) {
  const uniquePart = randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();

  return ["STK", "RSV", formatDatePart(date), date.getTime(), uniquePart].join(
    "-",
  );
}
