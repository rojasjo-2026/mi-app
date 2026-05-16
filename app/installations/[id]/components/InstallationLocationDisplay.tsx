import Card from "./Card";
import InfoGrid from "./InfoGrid";
import InfoRow from "./InfoRow";

type InstallationLocationDisplayProps = {
  zone?: string | null;
  city?: string | null;
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
  address_line,
  location_notes,
  reference_point,
  latitude,
  longitude,
  hasCoordinates,
  openStreetMapEmbedUrl,
  googleMapsUrl,
}: InstallationLocationDisplayProps) {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card title="📍 Ubicación">
        <InfoGrid>
          <InfoRow label="Zona" value={zone || "-"} />
          <InfoRow label="Ciudad" value={city || "-"} />
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
          <InfoRow label="Notas de ubicación" value={location_notes || "-"} />
          <InfoRow label="Punto de referencia" value={reference_point || "-"} />
        </InfoGrid>

        {googleMapsUrl && (
          <div className="pt-4">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Abrir en Google Maps
            </a>
          </div>
        )}
      </Card>

      <Card title="🗺️ Mapa">
        {openStreetMapEmbedUrl ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
              <iframe
                title="Mapa de ubicación de la instalación"
                src={openStreetMapEmbedUrl}
                className="h-80 w-full"
                loading="lazy"
              />
            </div>

            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Ver ruta en Google Maps
              </a>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
            No hay coordenadas disponibles para mostrar el mapa.
          </div>
        )}
      </Card>
    </section>
  );
}
