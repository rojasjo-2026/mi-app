"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import OperationalZoneSelect from "@/app/settings/components/OperationalZoneSelect";
import NotesSection from "@/components/installations/NotesSection";
import ClientSearchSection from "@/components/installations/ClientSearchSection";
import InstallationLocationSection from "@/components/installations/InstallationLocationSection";
import InstallationCoordinatesSection from "@/components/installations/InstallationCoordinatesSection";
import InstallationCommercialSection from "@/components/installations/InstallationCommercialSection";
import { provincias } from "@/lib/data/costa-rica-locations";

import {
  MAX_NOTES_LENGTH,
  type BrowserWindowWithGoogle,
  type BrowserWindowWithSpeech,
  type Client,
  type NominatimResponse,
  type SpeechRecognitionErrorEventLike,
  type SpeechRecognitionLike,
  type SpeechRecognitionResultEventLike,
} from "./config/newInstallationPageConfig";
import {
  findBestLocationMatch,
  getClientDisplayName,
  getMapsCountryRestriction,
  getSpeechRecognitionLocale,
  isCostaRicaPreset,
} from "./utils/newInstallationPageUtils";
import { CollapsibleSection } from "./components/CollapsibleSection";

export default function NewInstallationPage() {
  const addressRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const { businessCountryMeta, settingsError } = useAppSettings();

  const businessCountryPreset = businessCountryMeta.countryPreset;
  const businessLocale = businessCountryMeta.locale;
  const countryCode = businessCountryMeta.countryCode;

  const [clientSearch, setClientSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [serviceTypeId, setServiceTypeId] = useState("1");
  const [installationDate, setInstallationDate] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [billingStatus, setBillingStatus] = useState("PENDING");
  const [billingNotes, setBillingNotes] = useState("");
  const [technicianName, setTechnicianName] = useState("");
  const [operationalZoneId, setOperationalZoneId] = useState("");

  const [useClientAddress, setUseClientAddress] = useState(false);

  const [adminLevel1, setAdminLevel1] = useState("");
  const [adminLevel2, setAdminLevel2] = useState("");
  const [adminLevel3, setAdminLevel3] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationNotes, setLocationNotes] = useState("");
  const [referencePoint, setReferencePoint] = useState("");

  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [openSections, setOpenSections] = useState({
    main: false,
    commercial: false,
    location: false,
    coordinates: false,
    notes: false,
  });

  const speechRecognitionLocale = getSpeechRecognitionLocale(
    businessCountryPreset,
  );
  const mapsCountryRestriction = getMapsCountryRestriction(
    businessCountryPreset,
  );
  const shouldUseCostaRicaLocationCatalog = isCostaRicaPreset(
    businessCountryPreset,
  );

  const provinciaOptions = useMemo(
    () =>
      shouldUseCostaRicaLocationCatalog
        ? provincias.map((provincia) => provincia.nombre)
        : [],
    [shouldUseCostaRicaLocationCatalog],
  );

  const cantonOptions = useMemo(() => {
    if (!shouldUseCostaRicaLocationCatalog) return [];

    const provinciaSeleccionada = provincias.find(
      (provincia) => provincia.nombre === adminLevel1,
    );

    return provinciaSeleccionada?.cantones ?? [];
  }, [adminLevel1, shouldUseCostaRicaLocationCatalog]);

  const distritoOptions = useMemo(() => {
    if (!shouldUseCostaRicaLocationCatalog) return [];

    const cantonSeleccionado = cantonOptions.find(
      (canton) => canton.nombre === adminLevel2,
    );

    return cantonSeleccionado?.distritos ?? [];
  }, [adminLevel2, cantonOptions, shouldUseCostaRicaLocationCatalog]);

  function toggleSection(section: keyof typeof openSections) {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

  function handleProvinceChange(value: string) {
    setAdminLevel1(value);
    setAdminLevel2("");
    setAdminLevel3("");
  }

  function handleCantonChange(value: string) {
    setAdminLevel2(value);
    setAdminLevel3("");
  }

  function clearLocationFields() {
    setAdminLevel1("");
    setAdminLevel2("");
    setAdminLevel3("");
    setAddressLine("");
    setReferencePoint("");
    setOperationalZoneId("");
    setLatitude("");
    setLongitude("");
  }

  function applyClientLocation(client: Client) {
    setAdminLevel1(client.admin_level_1 || "");
    setAdminLevel2(client.admin_level_2 || "");
    setAdminLevel3(client.admin_level_3 || "");
    setAddressLine(client.address_line || "");
    setReferencePoint(client.reference_point || "");
    setOperationalZoneId(client.operational_zone_id || "");
    setLatitude(
      client.latitude !== null && client.latitude !== undefined
        ? String(client.latitude)
        : "",
    );
    setLongitude(
      client.longitude !== null && client.longitude !== undefined
        ? String(client.longitude)
        : "",
    );
  }

  function addTimestampedText(text: string) {
    const timestamp = new Date().toLocaleString(businessLocale);
    const newEntry = `[${timestamp}] ${text}`.trim();

    setLocationNotes((prev) => {
      const nextValue = prev ? `${prev}\n${newEntry}` : newEntry;
      return nextValue.slice(0, MAX_NOTES_LENGTH);
    });
  }

  function startVoiceRecognition() {
    const browserWindow = window as BrowserWindowWithSpeech;
    const SpeechRecognition =
      browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("El navegador no soporta reconocimiento de voz");
      return;
    }

    setError("");
    setMessage("");

    const recognition = new SpeechRecognition();
    recognition.lang = speechRecognitionLocale;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setMessage("Escuchando nota por voz...");
    };

    recognition.onresult = (event: SpeechRecognitionResultEventLike) => {
      const text = event.results?.[0]?.[0]?.transcript || "";

      if (text.trim()) {
        addTimestampedText(text);
        setMessage("Nota agregada por voz correctamente.");
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      console.error("Error de voz:", event?.error);
      setError("No se pudo capturar la nota por voz");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  }

  function stopVoiceRecognition() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  function clearNotes() {
    setLocationNotes("");
    setMessage("Notas limpiadas.");
    setError("");
  }

  function addManualNote() {
    addTimestampedText("Nueva nota");
    setMessage("Se agregó una nota con fecha y hora.");
    setError("");
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const browserWindow = window as BrowserWindowWithGoogle;
      const GoogleAutocomplete =
        browserWindow.google?.maps?.places?.Autocomplete;

      if (!GoogleAutocomplete || !addressRef.current) {
        return;
      }

      const autocomplete = new GoogleAutocomplete(addressRef.current, {
        componentRestrictions: { country: mapsCountryRestriction },
        fields: ["geometry", "formatted_address"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();

        if (!place.geometry) return;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        setLatitude(String(lat));
        setLongitude(String(lng));

        if (useClientAddress && selectedClient) {
          setMessage(
            "Se actualizaron las coordenadas usando el localizador sin cambiar la dirección del cliente.",
          );
          return;
        }

        setUseClientAddress(false);
        setAddressLine(place.formatted_address || "");
        setMessage("Se cargó una ubicación diferente a la del cliente.");
      });

      clearInterval(interval);
    }, 300);

    return () => clearInterval(interval);
  }, [mapsCountryRestriction, useClientAddress, selectedClient]);

  useEffect(() => {
    if (!clientSearch.trim()) {
      setClients([]);
      return;
    }

    if (
      selectedClient &&
      getClientDisplayName(selectedClient) === clientSearch.trim()
    ) {
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoadingClients(true);

        const params = new URLSearchParams();

        params.set("search", clientSearch.trim());
        params.set("status", "active");
        params.set("country_code", countryCode);

        const res = await fetch(`/api/clients?${params.toString()}`, {
          cache: "no-store",
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.message || "Error cargando clientes");
        }

        setClients(result.data || []);
      } catch (err) {
        console.error(err);
        setClients([]);
      } finally {
        setLoadingClients(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [clientSearch, selectedClient, countryCode]);

  useEffect(() => {
    if (selectedClient && useClientAddress) {
      applyClientLocation(selectedClient);
    }
  }, [selectedClient, useClientAddress]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  function handleSelectClient(client: Client) {
    setSelectedClient(client);
    setClientSearch(getClientDisplayName(client));
    setClients([]);
    setError("");
    setMessage("");

    if (!useClientAddress) {
      clearLocationFields();
    }
  }

  function handleToggleUseClientAddress(checked: boolean) {
    setUseClientAddress(checked);
    setError("");
    setMessage("");

    if (checked && selectedClient) {
      applyClientLocation(selectedClient);
      setMessage("Se cargó la dirección del cliente.");
      return;
    }

    if (!checked) {
      clearLocationFields();
    }
  }

  async function handleUseCurrentLocation() {
    setError("");
    setMessage("");

    if (!navigator.geolocation) {
      setError("Este navegador no soporta geolocalización");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLatitude(String(lat));
        setLongitude(String(lng));

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
              headers: {
                Accept: "application/json",
              },
            },
          );

          if (!res.ok) {
            throw new Error("No se pudo obtener la dirección");
          }

          const data: NominatimResponse = await res.json();

          if (useClientAddress && selectedClient) {
            setMessage(
              "Se actualizaron las coordenadas automáticamente sin cambiar la dirección del cliente.",
            );
            return;
          }

          setUseClientAddress(false);

          if (data.display_name) {
            setAddressLine(data.display_name);
          }

          if (shouldUseCostaRicaLocationCatalog) {
            const matchedLocation = findBestLocationMatch(data.address);

            if (matchedLocation.province) {
              setAdminLevel1(matchedLocation.province);
            } else {
              setAdminLevel1("");
            }

            if (matchedLocation.canton) {
              setAdminLevel2(matchedLocation.canton);
            } else {
              setAdminLevel2("");
            }

            if (matchedLocation.district) {
              setAdminLevel3(matchedLocation.district);
            } else {
              setAdminLevel3("");
            }
          } else {
            setAdminLevel1(data.address?.state || "");
            setAdminLevel2(
              data.address?.city ||
                data.address?.town ||
                data.address?.municipality ||
                "",
            );
            setAdminLevel3(
              data.address?.suburb ||
                data.address?.neighbourhood ||
                data.address?.village ||
                "",
            );
          }

          setMessage("Se detectó una ubicación distinta a la del cliente.");
        } catch (reverseError) {
          console.error("Reverse geocoding error:", reverseError);

          if (useClientAddress && selectedClient) {
            setMessage(
              "Se obtuvieron las coordenadas correctamente sin cambiar la dirección del cliente.",
            );
          } else {
            setMessage(
              "Ubicación obtenida correctamente, pero no se pudo autocompletar toda la dirección",
            );
          }
        } finally {
          setLocating(false);
        }
      },
      (geoError) => {
        console.error("Geolocation error:", geoError);
        setError("No se pudo obtener la ubicación actual");
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedClient || !installationDate || !serviceTypeId) {
      setError("Faltan campos obligatorios");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        client_id: selectedClient.client_id,
        service_type_id: Number(serviceTypeId),
        installation_date: installationDate,
        description: description || null,
        estimated_amount: estimatedAmount ? Number(estimatedAmount) : null,
        cost_amount: costAmount ? Number(costAmount) : null,
        billing_status: billingStatus || "PENDING",
        billing_notes: billingNotes || null,
        technician_name: technicianName || null,
        operational_zone_id: operationalZoneId || null,
        address_line: addressLine || null,
        admin_level_1: adminLevel1 || null,
        admin_level_2: adminLevel2 || null,
        admin_level_3: adminLevel3 || null,
        latitude: latitude || null,
        longitude: longitude || null,
        location_notes: locationNotes || null,
        reference_point: referencePoint || null,
      };

      const res = await fetch("/api/installations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setError(result.message || "Error creando instalación");
        setSaving(false);
        return;
      }

      setMessage("Instalación creada correctamente");

      const installationId =
        result?.data?.installation_id ||
        result?.installation?.installation_id ||
        result?.data?.id ||
        "";

      setTimeout(() => {
        const shouldCreateMaintenance = window.confirm(
          "¿Deseas programar un mantenimiento para esta instalación?",
        );

        if (shouldCreateMaintenance && installationId) {
          window.location.href = `/follow-ups/new?installationId=${installationId}`;
        } else {
          window.location.href = "/installations";
        }
      }, 500);
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "No se pudo crear la instalación",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6 xl:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
              Instalaciones
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Nueva instalación
            </h1>
            <p className="text-sm text-slate-500 md:text-base">
              Registrá un nuevo trabajo con cliente, ubicación y notas técnicas.
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            ← Volver
          </button>
        </div>

        {settingsError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            No se pudo cargar la configuración de la app. Se está usando la
            configuración base.
          </div>
        ) : null}

        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-6 text-white md:px-8">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                  País
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  {businessCountryMeta.countryName}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                  Cliente
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  {selectedClient
                    ? getClientDisplayName(selectedClient)
                    : "Pendiente"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                  Fecha
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  {installationDate || "Sin definir"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                  Ubicación
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  {adminLevel1 || adminLevel2 || adminLevel3
                    ? [adminLevel1, adminLevel2, adminLevel3]
                        .filter(Boolean)
                        .join(" · ")
                    : "Pendiente"}
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-3 px-6 py-6 md:px-8 md:py-8"
          >
            <CollapsibleSection
              title="Datos principales"
              isOpen={openSections.main}
              onToggle={() => toggleSection("main")}
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <ClientSearchSection
                  clientSearch={clientSearch}
                  setClientSearch={(value) => {
                    setClientSearch(value);
                    setSelectedClient(null);
                  }}
                  clients={clients}
                  selectedClient={selectedClient}
                  loadingClients={loadingClients}
                  handleSelectClient={handleSelectClient}
                  useClientAddress={useClientAddress}
                  handleToggleUseClientAddress={handleToggleUseClientAddress}
                />

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Service Type *
                    </label>
                    <input
                      value={serviceTypeId}
                      onChange={(e) => setServiceTypeId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      value={installationDate}
                      onChange={(e) => setInstallationDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Técnico
                  </label>
                  <input
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Descripción
                  </label>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Información comercial"
              isOpen={openSections.commercial}
              onToggle={() => toggleSection("commercial")}
            >
              <InstallationCommercialSection
                estimatedAmount={estimatedAmount}
                setEstimatedAmount={setEstimatedAmount}
                costAmount={costAmount}
                setCostAmount={setCostAmount}
                billingStatus={billingStatus}
                setBillingStatus={setBillingStatus}
                billingNotes={billingNotes}
                setBillingNotes={setBillingNotes}
                currencyCode={businessCountryMeta.currency}
              />
            </CollapsibleSection>

            <CollapsibleSection
              title="Ubicación"
              isOpen={openSections.location}
              onToggle={() => toggleSection("location")}
            >
              <div className="space-y-5">
                <InstallationLocationSection
                  useClientAddress={useClientAddress}
                  hasSelectedClient={!!selectedClient}
                  provinciaOptions={provinciaOptions}
                  cantonOptions={cantonOptions}
                  distritoOptions={distritoOptions}
                  adminLevel1={adminLevel1}
                  adminLevel2={adminLevel2}
                  adminLevel3={adminLevel3}
                  addressLine={addressLine}
                  referencePoint={referencePoint}
                  addressRef={addressRef}
                  handleProvinceChange={handleProvinceChange}
                  handleCantonChange={handleCantonChange}
                  setAdminLevel3={setAdminLevel3}
                  setAddressLine={setAddressLine}
                  setReferencePoint={setReferencePoint}
                  adminLevel1Label={businessCountryMeta.adminLevel1Label}
                  adminLevel2Label={businessCountryMeta.adminLevel2Label}
                  adminLevel3Label={businessCountryMeta.adminLevel3Label}
                />

                <OperationalZoneSelect
                  value={operationalZoneId}
                  countryCode={countryCode}
                  label="Zona operativa"
                  helperText="Seleccione una zona creada por el usuario. Esta zona ayudará al motor de disponibilidad a agrupar instalaciones, mantenimientos y rutas."
                  onChange={setOperationalZoneId}
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Coordenadas GPS"
              isOpen={openSections.coordinates}
              onToggle={() => toggleSection("coordinates")}
            >
              <InstallationCoordinatesSection
                locating={locating}
                latitude={latitude}
                longitude={longitude}
                handleUseCurrentLocation={handleUseCurrentLocation}
                setLatitude={setLatitude}
                setLongitude={setLongitude}
              />
            </CollapsibleSection>

            <CollapsibleSection
              title="Notas técnicas"
              isOpen={openSections.notes}
              onToggle={() => toggleSection("notes")}
            >
              <NotesSection
                locationNotes={locationNotes}
                setLocationNotes={setLocationNotes}
                isListening={isListening}
                startVoiceRecognition={startVoiceRecognition}
                stopVoiceRecognition={stopVoiceRecognition}
                addManualNote={addManualNote}
                clearNotes={clearNotes}
                maxNotesLength={MAX_NOTES_LENGTH}
              />
            </CollapsibleSection>

            <div className="space-y-3 pt-4">
              {message && (
                <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  {message}
                </p>
              )}

              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Guardar instalación"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
