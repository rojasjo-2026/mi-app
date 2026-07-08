import Card from "./Card";
import InfoGrid from "./InfoGrid";
import InfoRow from "./InfoRow";

type InstallationLocationDisplayProps = {
  zone?: string | null;
  city?: string | null;
  adminLevel1?: string | null;
  adminLevel2?: string | null;
  adminLevel3?: string | null;
  address_line?: string | null;
  location_notes?: string | null;
  reference_point?: string | null;
  latitude: number | null;
  longitude: number | null;
  hasCoordinates: boolean;
  openStreetMapEmbedUrl: string | null;
  googleMapsUrl: string | null;
};

export default function InstallationLocationDisplay({
  zone,
  city,
  adminLevel1,
  adminLevel2,
  adminLevel3,
  address_line,
  location_notes,
  reference_point,
  latitude,
  longitude,
  hasCoordinates,
  openStreetMapEmbedUrl,
  googleMapsUrl,
}: InstallationLocationDisplayProps) {
  const hasAdministrativeLocation = adminLevel1 || adminLevel2 || adminLevel3;

  return (
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <Card title="Ubicación">
        <InfoGrid>
          <InfoRow label="Zona operativa" value={zone || "-"} />

          {hasAdministrativeLocation ? (
            <>
              <InfoRow label="Provincia" value={adminLevel1 || "-"} />
              <InfoRow label="Cantón" value={adminLevel2 || "-"} />
              <InfoRow label="Distrito" value={adminLevel3 || "-"} />
            </>
          ) : (
            <InfoRow label="Área / ciudad" value={city || "-"} />
          )}

          <InfoRow
            label="Latitud"
            value={hasCoordinates ? String(latitude) : "-"}
          />
          <InfoRow
            label="Longitud"
            value={hasCoordinates ? String(longitude) : "-"}
          />
        </InfoGrid>

        <div className="pt-1">
          <InfoRow label="Dirección" value={address_line || "-"} />
        </div>

        <InfoGrid>
          <InfoRow label="Punto de referencia" value={reference_point || "-"} />
          <InfoRow label="Notas de ubicación" value={location_notes || "-"} />
        </InfoGrid>

        {googleMapsUrl ? (
          <div className="pt-4">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Abrir en Google Maps
            </a>
          </div>
        ) : null}
      </Card>

      <Card title="Mapa">
        {openStreetMapEmbedUrl ? (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <iframe
                title="Mapa de ubicación de la instalación"
                src={openStreetMapEmbedUrl}
                className="h-80 w-full"
                loading="lazy"
              />
            </div>

            {googleMapsUrl ? (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Ver ruta en Google Maps
              </a>
            ) : null}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
            No hay coordenadas disponibles para mostrar el mapa.
          </div>
        )}
      </Card>
    </section>
  );
}
