"use client";

import { useEffect, useState } from "react";

type Installation = {
  installation_id: string;
  latitude: number;
  longitude: number;
  installation_date: string;
  installation_status: string;
  client: {
    first_name: string;
    last_name_1: string;
  };
};

export default function MapPage() {
  const [installations, setInstallations] = useState<Installation[]>([]);

  useEffect(() => {
    async function loadData() {
      const res = await fetch("/api/installations");
      const data = await res.json();

      if (data.success) {
        setInstallations(data.data);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (!window.google) return;

    const map = new window.google.maps.Map(
      document.getElementById("map") as HTMLElement,
      {
        center: { lat: 9.7489, lng: -83.7534 }, // Costa Rica
        zoom: 8,
      },
    );

    installations.forEach((inst) => {
      if (!inst.latitude || !inst.longitude) return;

      const today = new Date();
      const date = new Date(inst.installation_date);

      let color = "green";

      if (date < today) color = "red";
      else if (date.toDateString() === today.toDateString()) color = "yellow";

      const marker = new window.google.maps.Marker({
        position: {
          lat: Number(inst.latitude),
          lng: Number(inst.longitude),
        },
        map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: color,
          fillOpacity: 1,
          strokeWeight: 1,
        },
      });

      const info = new window.google.maps.InfoWindow({
        content: `
          <div>
            <strong>${inst.client.first_name} ${inst.client.last_name_1}</strong><br/>
            Fecha: ${date.toLocaleDateString()}
          </div>
        `,
      });

      marker.addListener("click", () => {
        info.open(map, marker);
      });
    });
  }, [installations]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Mapa de Instalaciones</h1>
      <div id="map" style={{ width: "100%", height: "600px" }} />
    </div>
  );
}
