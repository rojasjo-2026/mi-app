"use client";

import { useEffect, useState } from "react";

type ServiceType = {
  service_type_id: number;
  code: string;
  name: string;
};

type ServiceTypesResponse = {
  success: boolean;
  data?: ServiceType[];
  message?: string;
};

type ServiceTypeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  onSelectedServiceTypeNameChange?: (name: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
};

export default function ServiceTypeSelect({
  value,
  onChange,
  onSelectedServiceTypeNameChange,
  label = "Tipo de servicio",
  required = false,
  disabled = false,
}: ServiceTypeSelectProps) {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadServiceTypes() {
      setLoading(true);

      try {
        const response = await fetch("/api/service-types", {
          cache: "no-store",
        });

        const result = (await response.json()) as ServiceTypesResponse;

        if (!response.ok || !result.success || !Array.isArray(result.data)) {
          if (isMounted) {
            setServiceTypes([]);
          }

          return;
        }

        if (isMounted) {
          setServiceTypes(result.data);
        }
      } catch {
        if (isMounted) {
          setServiceTypes([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadServiceTypes();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const selectedServiceType = serviceTypes.find(
      (serviceType) => String(serviceType.service_type_id) === value,
    );

    onSelectedServiceTypeNameChange?.(selectedServiceType?.name ?? "");
  }, [serviceTypes, value, onSelectedServiceTypeNameChange]);

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required ? " *" : ""}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled || loading}
        className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      >
        <option value="">
          {loading ? "Cargando tipos de servicio..." : "Seleccione servicio"}
        </option>

        {serviceTypes.map((serviceType) => (
          <option
            key={serviceType.service_type_id}
            value={String(serviceType.service_type_id)}
          >
            {serviceType.name}
          </option>
        ))}
      </select>

      {serviceTypes.length === 0 && !loading ? (
        <p className="mt-1 text-xs leading-5 text-slate-500">
          No hay tipos de servicio activos disponibles.
        </p>
      ) : null}
    </div>
  );
}
