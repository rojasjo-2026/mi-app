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
    <section>
      <Card title="Ubicación">
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-950">
                  Datos de ubicación
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Información administrativa y operativa del lugar.
                </p>
              </div>

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
              </InfoGrid>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-5">
              <h3 className="text-sm font-semibold text-slate-950">
                Dirección y referencias
              </h3>

              <InfoRow label="Dirección" value={address_line || "-"} />

              <InfoGrid>
                <InfoRow
                  label="Punto de referencia"
                  value={reference_point || "-"}
                />

                <InfoRow
                  label="Notas de ubicación"
                  value={location_notes || "-"}
                />
              </InfoGrid>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-5">
              <h3 className="text-sm font-semibold text-slate-950">
                Coordenadas
              </h3>

              <InfoGrid>
                <InfoRow
                  label="Latitud"
                  value={hasCoordinates ? String(latitude) : "-"}
                />

                <InfoRow
                  label="Longitud"
                  value={hasCoordinates ? String(longitude) : "-"}
                />
              </InfoGrid>
            </div>

            {googleMapsUrl ? (
              <div className="pt-1">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Abrir en Google Maps
                </a>
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">Mapa</h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Referencia visual de la ubicación registrada.
              </p>
            </div>

            {openStreetMapEmbedUrl ? (
              <>
                <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                  <iframe
                    title="Mapa de ubicación de la instalación"
                    src={openStreetMapEmbedUrl}
                    className="h-[420px] w-full"
                    loading="lazy"
                  />
                </div>

                {googleMapsUrl ? (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Ver ruta en Google Maps
                  </a>
                ) : null}
              </>
            ) : (
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm leading-6 text-slate-500">
                No hay coordenadas disponibles para mostrar el mapa.
              </div>
            )}
          </div>
        </div>
      </Card>
    </section>
  );
}
