export function getWhatsAppWebUrl(phone?: string | null) {
  const digits = String(phone || "").replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  return `https://wa.me/${digits}`;
}

