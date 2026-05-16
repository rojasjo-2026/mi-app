import type {
  ClientInstallation,
  CommercialItem,
  CommercialSummary,
} from "@/lib/clients/clientDetail.types";
import { toSafeNumber } from "@/lib/clients/clientDetail.utils";

export function buildClientCommercialSummary(
  installations: ClientInstallation[] = [],
): CommercialSummary {
  const items: CommercialItem[] = installations.flatMap((installation) => {
    const installationItem: CommercialItem = {
      id: installation.installation_id,
      type: "INSTALLATION",
      description: installation.description || "Instalación",
      date: installation.installation_date,
      estimatedAmount: toSafeNumber(installation.estimated_amount),
      costAmount: toSafeNumber(installation.cost_amount),
      billingStatus: installation.billing_status,
    };

    const followUpItems: CommercialItem[] = (installation.follow_ups || []).map(
      (followUp) => ({
        id: followUp.follow_up_id,
        type: "FOLLOW_UP",
        description: followUp.reason || "Mantenimiento",
        date: followUp.target_date,
        estimatedAmount: toSafeNumber(followUp.estimated_amount),
        costAmount: toSafeNumber(followUp.cost_amount),
        billingStatus: followUp.billing_status,
      }),
    );

    return [installationItem, ...followUpItems];
  });

  const billableItems = items.filter(
    (item) =>
      item.billingStatus !== "NOT_BILLABLE" &&
      item.billingStatus !== "CANCELLED",
  );

  const totalEstimated = billableItems.reduce(
    (total, item) => total + item.estimatedAmount,
    0,
  );

  const totalCost = billableItems.reduce(
    (total, item) => total + item.costAmount,
    0,
  );

  const pendingAmount = billableItems
    .filter((item) => !item.billingStatus || item.billingStatus === "PENDING")
    .reduce((total, item) => total + item.estimatedAmount, 0);

  const invoicedAmount = billableItems
    .filter(
      (item) =>
        item.billingStatus === "INVOICED" ||
        item.billingStatus === "PARTIALLY_PAID",
    )
    .reduce((total, item) => total + item.estimatedAmount, 0);

  const paidAmount = billableItems
    .filter((item) => item.billingStatus === "PAID")
    .reduce((total, item) => total + item.estimatedAmount, 0);

  return {
    items,
    recentItems: [...items]
      .filter((item) => item.estimatedAmount > 0 || item.costAmount > 0)
      .sort((a, b) => {
        const aDate = a.date ? new Date(a.date).getTime() : 0;
        const bDate = b.date ? new Date(b.date).getTime() : 0;

        return bDate - aDate;
      })
      .slice(0, 6),
    totalEstimated,
    totalCost,
    pendingAmount,
    invoicedAmount,
    paidAmount,
    profitAmount: totalEstimated - totalCost,
  };
}
