import type { InstallationDetail } from "@/lib/installations/installation-detail.types";

export function getLatitude(
  installation?: InstallationDetail | null,
): number | null {
  if (!installation?.latitude) return null;

  const value = Number(installation.latitude);
  return Number.isNaN(value) ? null : value;
}

export function getLongitude(
  installation?: InstallationDetail | null,
): number | null {
  if (!installation?.longitude) return null;

  const value = Number(installation.longitude);
  return Number.isNaN(value) ? null : value;
}

export function hasCoordinates(
  latitude: number | null,
  longitude: number | null,
): boolean {
  return latitude !== null && longitude !== null;
}

export function getOpenStreetMapEmbedUrl(
  latitude: number | null,
  longitude: number | null,
): string | null {
  if (latitude === null || longitude === null) return null;

  const offset = 0.0035;
  const left = longitude - offset;
  const right = longitude + offset;
  const top = latitude + offset;
  const bottom = latitude - offset;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}

export function getGoogleMapsUrl(
  latitude: number | null,
  longitude: number | null,
): string | null {
  if (latitude === null || longitude === null) return null;

  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export function getNextPendingFollowUp(
  installation?: InstallationDetail | null,
) {
  if (!installation?.follow_ups?.length) return null;

  const pending = installation.follow_ups
    .filter(
      (followUp) =>
        followUp.follow_up_status?.code !== "completed" && followUp.target_date,
    )
    .sort((a, b) => {
      return (
        new Date(a.target_date || "").getTime() -
        new Date(b.target_date || "").getTime()
      );
    });

  return pending[0] || null;
}

export function getSuggestedMaintenanceDate(
  installation?: InstallationDetail | null,
): string {
  const baseDate = installation?.installation_date
    ? new Date(installation.installation_date)
    : new Date();

  const nextDate = new Date(baseDate);
  nextDate.setMonth(nextDate.getMonth() + 6);

  return nextDate.toISOString().slice(0, 10);
}
