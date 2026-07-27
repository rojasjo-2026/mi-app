import { expect, test, type Page, type Route } from "@playwright/test";

type FollowUpStatusCode = "pending" | "completed" | "postponed";

type FollowUpItem = {
  follow_up_id: string;
  client_id: string;
  installation_id: string | null;
  target_date: string;
  scheduled_date?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
  reason: string | null;
  priority: number | null;
  maintenance_type?: string | null;
  estimated_amount?: number | null;
  final_amount?: number | null;
  cost_amount?: number | null;
  billing_status?: string | null;
  billing_notes?: string | null;
  technician_id?: string | null;
  technician?: {
    user_id?: string;
    first_name?: string | null;
    last_name_1?: string | null;
    email?: string | null;
    full_name?: string | null;
  } | null;
  operational_zone_id?: string | null;
  operational_zone?: {
    operational_zone_id: string;
    name: string;
    reference_address?: string | null;
  } | null;
  follow_up_status?: {
    code: FollowUpStatusCode;
    name: string;
  };
  client?: {
    client_id?: string;
    first_name?: string | null;
    last_name_1?: string | null;
    last_name_2?: string | null;
    phone_primary?: string | null;
    email?: string | null;
    operational_zone_id?: string | null;
    operational_zone?: {
      operational_zone_id: string;
      name: string;
    } | null;
  } | null;
  installation?: {
    installation_id?: string;
    description?: string | null;
    installation_date?: string | null;
    technician_name?: string | null;
    operational_zone_id?: string | null;
    operational_zone?: {
      operational_zone_id: string;
      name: string;
      reference_address?: string | null;
    } | null;
  } | null;
  created_from?: string | null;
};

type CalendarEvent = {
  id: string;
  date: string;
  type: string;
  title: string;
  description?: string | null;
};

type OperationsEvent = {
  id: string;
  entity_type: "installation" | "follow_up";
  date: string;
  type:
    | "installation"
    | "overdue"
    | "today"
    | "upcoming"
    | "confirmed"
    | "completed";
  title: string;
  description?: string;
  status?: string;
  priority?: string | number;
  billing_status?: string;
  operational_zone_id?: string | null;
  operational_zone_name?: string | null;
  operational_zone_reference_address?: string | null;
  route_address?: string | null;
  route_latitude?: number | null;
  route_longitude?: number | null;
};

type FollowUpNote = {
  follow_up_note_id: string;
  note_text: string;
  created_at: string;
};

type MockRuntime = {
  unhandledApiCalls: string[];
  writeApiCalls: string[];
  followUpsRequests: URL[];
  calendarRangeRequests: URL[];
  availabilityRequests: URL[];
  mapsScriptInterceptCount: number;
};

function dateKeyWithOffset(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isoWithOffset(offsetDays: number) {
  return `${dateKeyWithOffset(offsetDays)}T10:00:00.000Z`;
}

function buildFollowUpsFixture(totalItems = 18): FollowUpItem[] {
  const zones = [
    {
      operational_zone_id: "zone-1",
      name: "Zona Norte",
      reference_address: "San Jose centro",
    },
    {
      operational_zone_id: "zone-2",
      name: "Zona Sur",
      reference_address: "Cartago centro",
    },
  ];

  const baseItems: FollowUpItem[] = [
    {
      follow_up_id: "fu-1",
      client_id: "client-1",
      installation_id: "inst-1",
      target_date: isoWithOffset(0),
      due_date: isoWithOffset(3),
      reason: "Mantenimiento preventivo ascensor",
      priority: 1,
      maintenance_type: "PREVENTIVE",
      estimated_amount: 50000,
      final_amount: null,
      cost_amount: null,
      billing_status: "PENDING",
      billing_notes: "Sin facturar",
      technician_id: "tech-1",
      technician: {
        user_id: "tech-1",
        first_name: "Carlos",
        last_name_1: "Soto",
        full_name: "Carlos Soto",
        email: "carlos@example.test",
      },
      operational_zone_id: "zone-1",
      operational_zone: zones[0],
      follow_up_status: {
        code: "pending",
        name: "Pendiente",
      },
      client: {
        client_id: "client-1",
        first_name: "Ana",
        last_name_1: "Perez",
        phone_primary: "+50611111111",
        email: "ana@example.test",
        operational_zone_id: "zone-1",
        operational_zone: {
          operational_zone_id: "zone-1",
          name: "Zona Norte",
        },
      },
      installation: {
        installation_id: "inst-1",
        description: "Edificio Norte",
        installation_date: dateKeyWithOffset(-60),
        technician_name: "Carlos Soto",
        operational_zone_id: "zone-1",
        operational_zone: zones[0],
      },
      created_from: "AUTO",
    },
    {
      follow_up_id: "fu-2",
      client_id: "client-2",
      installation_id: "inst-2",
      target_date: isoWithOffset(-2),
      due_date: isoWithOffset(-1),
      completed_at: isoWithOffset(-1),
      reason: "Revisión general bomba",
      priority: 2,
      maintenance_type: "CORRECTIVE",
      estimated_amount: 90000,
      final_amount: 87000,
      cost_amount: 50000,
      billing_status: "PAID",
      billing_notes: "Pagado",
      technician_id: "tech-2",
      technician: {
        user_id: "tech-2",
        first_name: "Laura",
        last_name_1: "Mora",
        full_name: "Laura Mora",
        email: "laura@example.test",
      },
      operational_zone_id: null,
      operational_zone: null,
      follow_up_status: {
        code: "completed",
        name: "Completado",
      },
      client: {
        client_id: "client-2",
        first_name: "Bruno",
        last_name_1: "Diaz",
        phone_primary: "+50622222222",
        email: "bruno@example.test",
        operational_zone_id: null,
        operational_zone: null,
      },
      installation: {
        installation_id: "inst-2",
        description: "Bodega Sur",
        installation_date: dateKeyWithOffset(-120),
        technician_name: "Laura Mora",
        operational_zone_id: null,
        operational_zone: null,
      },
      created_from: "MANUAL",
    },
    {
      follow_up_id: "fu-3",
      client_id: "client-3",
      installation_id: null,
      target_date: isoWithOffset(4),
      due_date: isoWithOffset(8),
      reason: "Ajuste de tablero eléctrico",
      priority: 3,
      maintenance_type: "PREDICTIVE",
      estimated_amount: 45000,
      final_amount: null,
      cost_amount: null,
      billing_status: "INVOICED",
      billing_notes: "Factura emitida",
      technician_id: null,
      technician: null,
      operational_zone_id: "zone-2",
      operational_zone: zones[1],
      follow_up_status: {
        code: "postponed",
        name: "Pospuesto",
      },
      client: {
        client_id: "client-3",
        first_name: "Carla",
        last_name_1: "Rojas",
        phone_primary: "+50633333333",
        email: "carla@example.test",
        operational_zone_id: "zone-2",
        operational_zone: {
          operational_zone_id: "zone-2",
          name: "Zona Sur",
        },
      },
      installation: null,
      created_from: "AUTO",
    },
  ];

  const generated: FollowUpItem[] = [];
  for (let index = 4; index <= totalItems; index += 1) {
    const isNorth = index % 2 === 0;
    const statusCode: FollowUpStatusCode =
      index % 5 === 0 ? "completed" : index % 3 === 0 ? "postponed" : "pending";

    generated.push({
      follow_up_id: `fu-${index}`,
      client_id: `client-${index}`,
      installation_id: `inst-${index}`,
      target_date: isoWithOffset((index % 7) - 3),
      due_date: isoWithOffset((index % 7) + 2),
      reason: `Mantenimiento cliente ${index}`,
      priority: ((index % 3) + 1) as 1 | 2 | 3,
      maintenance_type: "PREVENTIVE",
      estimated_amount: 30000 + index * 1000,
      final_amount: null,
      cost_amount: null,
      billing_status: index % 2 === 0 ? "PENDING" : "PAID",
      billing_notes: null,
      technician_id: "tech-1",
      technician: {
        user_id: "tech-1",
        first_name: "Carlos",
        last_name_1: "Soto",
        full_name: "Carlos Soto",
      },
      operational_zone_id: isNorth ? "zone-1" : "zone-2",
      operational_zone: isNorth ? zones[0] : zones[1],
      follow_up_status: {
        code: statusCode,
        name:
          statusCode === "pending"
            ? "Pendiente"
            : statusCode === "completed"
              ? "Completado"
              : "Pospuesto",
      },
      client: {
        client_id: `client-${index}`,
        first_name: "Cliente",
        last_name_1: String(index),
        phone_primary: `+5065000${String(index).padStart(4, "0")}`,
        email: `cliente${index}@example.test`,
      },
      installation: {
        installation_id: `inst-${index}`,
        description: `Instalación ${index}`,
        installation_date: dateKeyWithOffset(-index),
        technician_name: "Carlos Soto",
      },
      created_from: "AUTO",
    });
  }

  return [...baseItems, ...generated];
}

function buildFollowUpsMetrics(items: FollowUpItem[]) {
  return {
    total: items.length,
    pending: items.filter((item) => item.follow_up_status?.code === "pending")
      .length,
    completed: items.filter(
      (item) => item.follow_up_status?.code === "completed",
    ).length,
    overdue: items.filter(
      (item) => new Date(item.target_date).getTime() < Date.now(),
    ).length,
    today: items.filter((item) =>
      item.target_date.startsWith(dateKeyWithOffset(0)),
    ).length,
    pendingBilling: items.filter((item) => item.billing_status === "PENDING")
      .length,
  };
}

function classifyTiming(item: FollowUpItem): "overdue" | "today" | "upcoming" {
  const today = dateKeyWithOffset(0);
  const itemDate = item.target_date.slice(0, 10);

  if (itemDate < today) {
    return "overdue";
  }

  if (itemDate === today) {
    return "today";
  }

  return "upcoming";
}

function buildCalendarEvents(): CalendarEvent[] {
  return [
    {
      id: "cal-1",
      date: dateKeyWithOffset(0),
      type: "today",
      title: "Mantenimiento Ana Perez",
      description: "Visita programada",
    },
    {
      id: "cal-2",
      date: dateKeyWithOffset(0),
      type: "installation",
      title: "Instalación Edificio Norte",
      description: "Pendiente de cierre",
    },
    {
      id: "cal-3",
      date: dateKeyWithOffset(1),
      type: "upcoming",
      title: "Revisión Carla Rojas",
      description: "Confirmar fecha",
    },
    {
      id: "cal-4",
      date: dateKeyWithOffset(-1),
      type: "overdue",
      title: "Mantenimiento vencido",
      description: "Requiere reprogramación",
    },
  ];
}

function buildOperationsEvents(): OperationsEvent[] {
  return [
    {
      id: "op-1",
      entity_type: "installation",
      date: dateKeyWithOffset(0),
      type: "installation",
      title: "Instalación Torre Norte",
      description: "Punto A",
      status: "OPEN",
      priority: "Alta",
      billing_status: "PENDING",
      operational_zone_id: "zone-1",
      operational_zone_name: "Zona Norte",
      operational_zone_reference_address: "San Jose centro",
      route_address: "9.933,-84.083",
      route_latitude: 9.933,
      route_longitude: -84.083,
    },
    {
      id: "op-2",
      entity_type: "follow_up",
      date: dateKeyWithOffset(0),
      type: "today",
      title: "Mantenimiento Ana Perez",
      description: "Punto B",
      status: "PENDIENTE",
      priority: "Media",
      billing_status: "PENDING",
      operational_zone_id: "zone-1",
      operational_zone_name: "Zona Norte",
      operational_zone_reference_address: "San Jose centro",
      route_address: "9.936,-84.085",
      route_latitude: 9.936,
      route_longitude: -84.085,
    },
    {
      id: "op-3",
      entity_type: "follow_up",
      date: dateKeyWithOffset(2),
      type: "upcoming",
      title: "Mantenimiento Bruno Diaz",
      description: "Punto C",
      status: "PENDIENTE",
      priority: "Baja",
      billing_status: "INVOICED",
      operational_zone_id: "zone-2",
      operational_zone_name: "Zona Sur",
      operational_zone_reference_address: "Cartago centro",
      route_address: "9.865,-83.919",
      route_latitude: 9.865,
      route_longitude: -83.919,
    },
    {
      id: "op-4",
      entity_type: "installation",
      date: dateKeyWithOffset(6),
      type: "confirmed",
      title: "Instalación Bodega Central",
      description: "Punto D",
      status: "IN_PROGRESS",
      priority: "Alta",
      billing_status: "PENDING",
      operational_zone_id: null,
      operational_zone_name: "Sin agrupación asignada",
      operational_zone_reference_address: null,
      route_address: "9.900,-84.100",
      route_latitude: 9.9,
      route_longitude: -84.1,
    },
  ];
}

function filterOperationsEventsByRange(
  events: OperationsEvent[],
  startDate: string,
  endDate: string,
) {
  return events.filter(
    (event) => event.date >= startDate && event.date <= endDate,
  );
}

function buildAvailabilityItem(date: string) {
  const baseJobs = Math.max(0, Number(date.split("-").at(-1)) % 6);

  return {
    date,
    can_offer_day: baseJobs < 5,
    reason: baseJobs < 5 ? "Capacidad disponible" : "Capacidad al límite",
    workload: {
      total_jobs: baseJobs,
      total_installations: Math.max(0, baseJobs - 1),
      total_maintenances: 1,
      has_installation: baseJobs > 0,
    },
    capacity: {
      max_jobs_per_day: 5,
      max_installations_per_day: 3,
      max_maintenances_per_day: 3,
      remaining_jobs_capacity: Math.max(0, 5 - baseJobs),
      remaining_installations_capacity: Math.max(
        0,
        3 - Math.max(0, baseJobs - 1),
      ),
      remaining_maintenances_capacity: 2,
    },
  };
}

function enumerateDates(startDate: string, days: number) {
  const dates: string[] = [];

  for (let offset = 0; offset < days; offset += 1) {
    dates.push(dateKeyWithOffset(offset + differenceFromToday(startDate)));
  }

  return dates;
}

function differenceFromToday(dateValue: string) {
  const today = new Date(`${dateKeyWithOffset(0)}T00:00:00.000`);
  const target = new Date(`${dateValue}T00:00:00.000`);
  const milliseconds = target.getTime() - today.getTime();

  return Math.round(milliseconds / (1000 * 60 * 60 * 24));
}

async function fulfillJson(route: Route, status: number, payload: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(payload),
  });
}

async function setupMocks(page: Page): Promise<MockRuntime> {
  const runtime: MockRuntime = {
    unhandledApiCalls: [],
    writeApiCalls: [],
    followUpsRequests: [],
    calendarRangeRequests: [],
    availabilityRequests: [],
    mapsScriptInterceptCount: 0,
  };

  const followUps = buildFollowUpsFixture();
  const followUpById = new Map(
    followUps.map((item) => [item.follow_up_id, item]),
  );

  const followUpNotesById = new Map<string, FollowUpNote[]>([
    [
      "fu-1",
      [
        {
          follow_up_note_id: "fu1-note-1",
          note_text: "Nota inicial del mantenimiento",
          created_at: new Date().toISOString(),
        },
      ],
    ],
  ]);

  let calendarNotes: CalendarEvent[] = [
    {
      id: "note-1",
      type: "note",
      date: dateKeyWithOffset(0),
      title: "Nota del día",
      description: "Nota inicial",
    },
  ];

  let blockedDates: CalendarEvent[] = [];

  const baseCalendarEvents = buildCalendarEvents();
  const baseOperationsEvents = buildOperationsEvents();

  await page.route(
    /https:\/\/maps\.googleapis\.com\/maps\/api\/js(?:\?.*)?$/,
    async (route) => {
      runtime.mapsScriptInterceptCount += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: "window.google = window.google || { maps: { places: { Autocomplete: function(){ return { addListener: function(){}, getPlace: function(){ return { formatted_address: '', geometry: { location: { lat: function(){ return 0; }, lng: function(){ return 0; } } } }; } }; } } } };",
      });
    },
  );

  await page.route("**/api/**", async (route) => {
    const method = route.request().method();
    const requestUrl = new URL(route.request().url());
    const pathname = requestUrl.pathname;

    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      runtime.writeApiCalls.push(`${method} ${pathname}`);
    }

    if (pathname === "/maps/api/js" && method === "GET") {
      runtime.mapsScriptInterceptCount += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: "window.google = window.google || { maps: { places: { Autocomplete: function(){ return { addListener: function(){}, getPlace: function(){ return { formatted_address: '', geometry: { location: { lat: function(){ return 0; }, lng: function(){ return 0; } } } }; } }; } } } };",
      });
      return;
    }

    if (pathname === "/api/settings" && method === "GET") {
      await fulfillJson(route, 200, {
        success: true,
        data: {
          country_code: "CR",
          locale: "es-CR",
          currency_code: "CRC",
          time_zone: "America/Costa_Rica",
          maintenance_contact_days_before: 3,
          manual_followup_enabled: true,
        },
      });
      return;
    }

    if (pathname === "/api/operational-zones" && method === "GET") {
      await fulfillJson(route, 200, {
        success: true,
        data: [
          {
            operational_zone_id: "zone-1",
            name: "Zona Norte",
            reference_address: "San Jose centro",
            is_active: true,
          },
          {
            operational_zone_id: "zone-2",
            name: "Zona Sur",
            reference_address: "Cartago centro",
            is_active: true,
          },
        ],
      });
      return;
    }

    if (
      /^\/api\/operational-zones\/[^/]+\/visit-date-suggestions$/.test(
        pathname,
      ) &&
      method === "GET"
    ) {
      await fulfillJson(route, 200, {
        success: true,
        data: [
          {
            operational_zone_visit_date_id: "s1",
            operational_zone_id: "zone-1",
            visit_date: dateKeyWithOffset(1),
            can_offer_day: true,
            reason: "Disponibilidad de cuadrilla",
          },
        ],
      });
      return;
    }

    if (pathname === "/api/follow-ups" && method === "GET") {
      runtime.followUpsRequests.push(requestUrl);

      const status = requestUrl.searchParams.get("status");
      const timing = requestUrl.searchParams.get("timing");
      const priority = requestUrl.searchParams.get("priority");
      const billingStatus = requestUrl.searchParams.get("billingStatus");
      const operationalZone = requestUrl.searchParams.get(
        "operational_zone_id",
      );
      const search = (requestUrl.searchParams.get("search") || "")
        .trim()
        .toLowerCase();

      let filtered = [...followUps];

      if (status) {
        filtered = filtered.filter(
          (item) => item.follow_up_status?.code === status,
        );
      }

      if (timing) {
        filtered = filtered.filter((item) => classifyTiming(item) === timing);
      }

      if (priority) {
        filtered = filtered.filter(
          (item) => String(item.priority || "") === priority,
        );
      }

      if (billingStatus) {
        filtered = filtered.filter(
          (item) => item.billing_status === billingStatus,
        );
      }

      if (operationalZone) {
        if (operationalZone === "without") {
          filtered = filtered.filter((item) => !item.operational_zone_id);
        } else {
          filtered = filtered.filter(
            (item) => item.operational_zone_id === operationalZone,
          );
        }
      }

      if (search) {
        filtered = filtered.filter((item) => {
          const fields = [
            item.reason || "",
            item.client?.first_name || "",
            item.client?.last_name_1 || "",
            item.client?.phone_primary || "",
            item.installation?.description || "",
            item.operational_zone?.name || "",
            item.technician?.full_name || "",
          ]
            .join(" ")
            .toLowerCase();

          return fields.includes(search);
        });
      }

      const page = Number(requestUrl.searchParams.get("page") || "1");
      const pageSize = Number(requestUrl.searchParams.get("pageSize") || "15");
      const start = Math.max(0, (page - 1) * pageSize);
      const paged = filtered.slice(start, start + pageSize);

      await fulfillJson(route, 200, {
        success: true,
        data: paged,
        pagination: {
          page,
          pageSize,
          totalItems: filtered.length,
          totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
        },
        metrics: buildFollowUpsMetrics(filtered),
      });
      return;
    }

    if (
      /^\/api\/follow-ups\/[^/]+\/postpone$/.test(pathname) &&
      method === "PATCH"
    ) {
      const id = pathname.split("/")[3] || "";
      const current = followUpById.get(id);

      if (!current) {
        await fulfillJson(route, 404, {
          success: false,
          message: "Mantenimiento no encontrado",
        });
        return;
      }

      const payload = route.request().postDataJSON() as {
        target_date?: string;
      };

      current.target_date = `${payload.target_date || dateKeyWithOffset(1)}T10:00:00.000Z`;
      current.follow_up_status = {
        code: "postponed",
        name: "Pospuesto",
      };

      await fulfillJson(route, 200, {
        success: true,
        data: current,
      });
      return;
    }

    if (
      /^\/api\/follow-ups\/[^/]+\/notes$/.test(pathname) &&
      method === "GET"
    ) {
      const id = pathname.split("/")[3] || "";
      await fulfillJson(route, 200, {
        success: true,
        data: followUpNotesById.get(id) || [],
      });
      return;
    }

    if (
      /^\/api\/follow-ups\/[^/]+\/notes$/.test(pathname) &&
      method === "POST"
    ) {
      const id = pathname.split("/")[3] || "";
      const payload = route.request().postDataJSON() as { note?: string };
      const currentNotes = followUpNotesById.get(id) || [];
      const created: FollowUpNote = {
        follow_up_note_id: `note-${Date.now()}`,
        note_text: payload.note || "",
        created_at: new Date().toISOString(),
      };

      followUpNotesById.set(id, [created, ...currentNotes]);

      await fulfillJson(route, 201, {
        success: true,
        data: created,
      });
      return;
    }

    if (/^\/api\/follow-ups\/[^/]+$/.test(pathname) && method === "GET") {
      const id = pathname.split("/")[3] || "";
      const current = followUpById.get(id);

      if (!current) {
        await fulfillJson(route, 404, {
          success: false,
          message: "Mantenimiento no encontrado",
        });
        return;
      }

      await fulfillJson(route, 200, {
        success: true,
        data: current,
      });
      return;
    }

    if (/^\/api\/follow-ups\/[^/]+$/.test(pathname) && method === "PATCH") {
      const id = pathname.split("/")[3] || "";
      const current = followUpById.get(id);

      if (!current) {
        await fulfillJson(route, 404, {
          success: false,
          message: "No encontrado",
        });
        return;
      }

      const payload = (route.request().postDataJSON() || {}) as Record<
        string,
        unknown
      >;

      current.reason = String(payload.reason || current.reason || "");
      current.priority = Number(payload.priority || current.priority || 3);
      current.billing_status = String(
        payload.billing_status || current.billing_status || "PENDING",
      );

      await fulfillJson(route, 200, {
        success: true,
        data: current,
      });
      return;
    }

    if (/^\/api\/follow-ups\/[^/]+$/.test(pathname) && method === "PUT") {
      const id = pathname.split("/")[3] || "";
      const current = followUpById.get(id);

      if (!current) {
        await fulfillJson(route, 404, {
          success: false,
          message: "No encontrado",
        });
        return;
      }

      current.follow_up_status = {
        code: "completed",
        name: "Completado",
      };
      current.completed_at = new Date().toISOString();

      await fulfillJson(route, 200, {
        success: true,
        data: current,
      });
      return;
    }

    if (pathname === "/api/users" && method === "GET") {
      await fulfillJson(route, 200, {
        success: true,
        data: [
          {
            user_id: "tech-1",
            first_name: "Carlos",
            last_name_1: "Soto",
            role: "TECHNICIAN",
            is_active: true,
          },
          {
            user_id: "tech-2",
            first_name: "Laura",
            last_name_1: "Mora",
            role: "TECHNICIAN",
            is_active: true,
          },
        ],
      });
      return;
    }

    if (pathname === "/api/activity-logs" && method === "GET") {
      await fulfillJson(route, 200, {
        success: true,
        data: [],
        pagination: {
          total: 0,
          take: 6,
          skip: 0,
          page: 1,
          totalPages: 1,
        },
      });
      return;
    }

    if (pathname === "/api/files" && method === "GET") {
      await fulfillJson(route, 200, {
        success: true,
        data: [],
      });
      return;
    }

    if (pathname === "/api/contact-flows" && method === "GET") {
      await fulfillJson(route, 200, {
        success: true,
        data: [],
      });
      return;
    }

    if (pathname === "/api/contact-flows" && method === "POST") {
      await fulfillJson(route, 201, {
        success: true,
        data: {
          contact_flow_id: "cf-1",
          follow_up_id: "fu-1",
          status: "PENDING",
        },
      });
      return;
    }

    if (
      /^\/api\/contact-flows\/[^/]+\/messages$/.test(pathname) &&
      method === "GET"
    ) {
      await fulfillJson(route, 200, {
        success: true,
        data: [],
      });
      return;
    }

    if (
      /^\/api\/contact-flows\/[^/]+\/date-review$/.test(pathname) &&
      method === "GET"
    ) {
      await fulfillJson(route, 200, {
        success: true,
        data: {
          contact_flow_id: "cf-1",
          follow_up_id: "fu-1",
          status: "MANUAL_REQUIRED",
          selected_date: dateKeyWithOffset(1),
          scheduled_date: null,
          requires_manual_action: true,
          manual_reason: "Validar fecha",
          operational_zone_id: "zone-1",
          selected_date_availability: {
            checked: true,
            can_offer_day: true,
            reason: "Capacidad disponible",
          },
          available_dates: [],
        },
      });
      return;
    }

    if (
      /^\/api\/contact-flows\/[^/]+\/date-review$/.test(pathname) &&
      method === "POST"
    ) {
      await fulfillJson(route, 200, {
        success: true,
        message: "Revisión aplicada",
      });
      return;
    }

    if (pathname === "/api/whatsapp/send" && method === "POST") {
      await fulfillJson(route, 200, {
        success: true,
      });
      return;
    }

    if (pathname === "/api/whatsapp/send-media" && method === "POST") {
      await fulfillJson(route, 200, {
        success: true,
      });
      return;
    }

    if (pathname === "/api/calendar" && method === "GET") {
      const startDate = requestUrl.searchParams.get("startDate");
      const endDate = requestUrl.searchParams.get("endDate");

      if (startDate && endDate) {
        runtime.calendarRangeRequests.push(requestUrl);
        await fulfillJson(route, 200, {
          success: true,
          data: filterOperationsEventsByRange(
            baseOperationsEvents,
            startDate,
            endDate,
          ),
        });
        return;
      }

      await fulfillJson(route, 200, {
        success: true,
        data: baseCalendarEvents,
      });
      return;
    }

    if (pathname === "/api/calendar-notes" && method === "GET") {
      await fulfillJson(route, 200, {
        success: true,
        data: calendarNotes,
      });
      return;
    }

    if (pathname === "/api/calendar-notes" && method === "POST") {
      const payload = route.request().postDataJSON() as {
        note_date?: string;
        note_text?: string;
      };
      const created: CalendarEvent = {
        id: `note-${Date.now()}`,
        type: "note",
        date: payload.note_date || dateKeyWithOffset(0),
        title: "Nota del día",
        description: payload.note_text || "",
      };

      calendarNotes = [created, ...calendarNotes];

      await fulfillJson(route, 201, {
        success: true,
        data: created,
      });
      return;
    }

    if (pathname === "/api/calendar-notes" && method === "PUT") {
      const payload = route.request().postDataJSON() as {
        id?: string;
        note_text?: string;
      };

      calendarNotes = calendarNotes.map((note) =>
        note.id === payload.id
          ? {
              ...note,
              description: payload.note_text || note.description,
            }
          : note,
      );

      await fulfillJson(route, 200, {
        success: true,
      });
      return;
    }

    if (pathname === "/api/calendar-notes" && method === "DELETE") {
      const payload = route.request().postDataJSON() as { id?: string };
      calendarNotes = calendarNotes.filter((note) => note.id !== payload.id);

      await fulfillJson(route, 200, {
        success: true,
      });
      return;
    }

    if (pathname === "/api/calendar-blocked" && method === "GET") {
      await fulfillJson(route, 200, {
        success: true,
        data: blockedDates,
      });
      return;
    }

    if (pathname === "/api/calendar-blocked" && method === "POST") {
      const payload = route.request().postDataJSON() as {
        blocked_date?: string;
      };

      const created: CalendarEvent = {
        id: `blocked-${Date.now()}`,
        date: payload.blocked_date || dateKeyWithOffset(0),
        type: "blocked",
        title: "Fecha bloqueada",
        description: "Fecha bloqueada por operación",
      };

      blockedDates = [...blockedDates, created];

      await fulfillJson(route, 201, {
        success: true,
        data: created,
      });
      return;
    }

    if (pathname === "/api/calendar-blocked" && method === "DELETE") {
      const payload = route.request().postDataJSON() as { id?: string };
      blockedDates = blockedDates.filter((event) => event.id !== payload.id);

      await fulfillJson(route, 200, {
        success: true,
      });
      return;
    }

    if (pathname === "/api/calendar-non-working-days" && method === "GET") {
      await fulfillJson(route, 200, {
        success: true,
        data: [],
      });
      return;
    }

    if (pathname === "/api/availability/daily" && method === "GET") {
      runtime.availabilityRequests.push(requestUrl);

      const date = requestUrl.searchParams.get("date") || dateKeyWithOffset(0);
      const days = requestUrl.searchParams.get("days");

      if (days) {
        const totalDays = Number(days);
        const dates = enumerateDates(date, totalDays);
        const results = dates.map((value) => buildAvailabilityItem(value));

        await fulfillJson(route, 200, {
          success: true,
          data: {
            country_code: "CR",
            start_date: date,
            days: totalDays,
            operational_zone_id: null,
            results,
          },
        });
        return;
      }

      await fulfillJson(route, 200, {
        success: true,
        data: buildAvailabilityItem(date),
      });
      return;
    }

    runtime.unhandledApiCalls.push(`${method} ${pathname}`);
    await fulfillJson(route, 404, {
      success: false,
      message: `Mock not configured for ${method} ${pathname}`,
    });
  });

  return runtime;
}

async function assertNoUnhandledApiCalls(runtime: MockRuntime) {
  expect(
    runtime.unhandledApiCalls,
    `Unhandled API calls: ${runtime.unhandledApiCalls.join(", ")}`,
  ).toEqual([]);
}

test.describe("Fase 2G - Follow-ups, Calendario y Centro Operativo", () => {
  test("01 FOLLOW-UPS: carga inicial con métricas y filas", async ({
    page,
  }) => {
    const runtime = await setupMocks(page);

    await page.goto("/follow-ups");

    await expect(
      page.getByRole("heading", { name: "Mantenimientos" }),
    ).toBeVisible();
    await expect(page.getByText("Total")).toBeVisible();
    await expect(page.locator('[data-follow-up-row="true"]')).toHaveCount(15);
    await expect(page.getByText("Ana Perez")).toBeVisible();

    await assertNoUnhandledApiCalls(runtime);
  });

  test("02 FOLLOW-UPS: búsqueda envía query y filtra resultados", async ({
    page,
  }) => {
    const runtime = await setupMocks(page);

    await page.goto("/follow-ups");

    const searchInput = page.getByPlaceholder(
      "Buscar por cliente, teléfono, instalación, zona operativa, técnico o motivo...",
    );

    await searchInput.fill("Ana Perez");

    await expect
      .poll(() =>
        runtime.followUpsRequests.some(
          (url) => url.searchParams.get("search") === "Ana Perez",
        ),
      )
      .toBe(true);

    const rows = page.locator('[data-follow-up-row="true"]');
    await expect(rows).toHaveCount(1);
    await expect(page.getByText("Ana Perez")).toBeVisible();

    await assertNoUnhandledApiCalls(runtime);
  });

  test("03 FOLLOW-UPS: filtro por estado completados", async ({ page }) => {
    const runtime = await setupMocks(page);

    await page.goto("/follow-ups");

    await page.getByRole("button", { name: "Completados" }).click();

    await expect
      .poll(() =>
        runtime.followUpsRequests.some(
          (url) => url.searchParams.get("status") === "completed",
        ),
      )
      .toBe(true);

    await expect(page.getByText("Bruno Diaz")).toBeVisible();
    await expect(page.getByText("Ana Perez")).toHaveCount(0);

    await assertNoUnhandledApiCalls(runtime);
  });

  test("04 FOLLOW-UPS: filtro por prioridad alta", async ({ page }) => {
    const runtime = await setupMocks(page);

    await page.goto("/follow-ups");

    await page.locator('select:has(option[value="1"])').selectOption("1");

    await expect
      .poll(() =>
        runtime.followUpsRequests.some(
          (url) => url.searchParams.get("priority") === "1",
        ),
      )
      .toBe(true);

    await expect(page.getByText("Ana Perez")).toBeVisible();

    await assertNoUnhandledApiCalls(runtime);
  });

  test("05 FOLLOW-UPS: filtro por zona sin asignar", async ({ page }) => {
    const runtime = await setupMocks(page);

    await page.goto("/follow-ups");

    await page
      .locator('select:has(option[value="without"])')
      .selectOption("without");

    await expect
      .poll(() =>
        runtime.followUpsRequests.some(
          (url) => url.searchParams.get("operational_zone_id") === "without",
        ),
      )
      .toBe(true);

    await expect(page.getByText("Bruno Diaz")).toBeVisible();
    await expect(page.getByText("Ana Perez")).toHaveCount(0);

    await assertNoUnhandledApiCalls(runtime);
  });

  test("06 FOLLOW-UPS: estado vacío con CTA", async ({ page }) => {
    const runtime = await setupMocks(page);

    await page.goto("/follow-ups");

    await page
      .getByPlaceholder(
        "Buscar por cliente, teléfono, instalación, zona operativa, técnico o motivo...",
      )
      .fill("cliente inexistente xyz");

    await expect(
      page.getByText("No se encontraron mantenimientos"),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Crear mantenimiento" }),
    ).toBeVisible();

    await assertNoUnhandledApiCalls(runtime);
  });

  test("07 FOLLOW-UPS: paginación siguiente y anterior", async ({ page }) => {
    const runtime = await setupMocks(page);

    await page.goto("/follow-ups");

    await expect(page.getByText("Página 1 de 2")).toBeVisible();
    await page.getByRole("button", { name: "Siguiente" }).click();
    await expect(page.getByText("Página 2 de 2")).toBeVisible();

    await page.getByRole("button", { name: "Anterior" }).click();
    await expect(page.getByText("Página 1 de 2")).toBeVisible();

    await assertNoUnhandledApiCalls(runtime);
  });

  test("08 FOLLOW-UPS: abre y cierra panel de preview", async ({ page }) => {
    const runtime = await setupMocks(page);

    await page.goto("/follow-ups");

    const anaRow = page.locator('[data-follow-up-row="true"]').filter({
      has: page.getByText("Ana Perez", { exact: true }),
    });

    await anaRow.click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Ver detalle completo" }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Cerrar panel de mantenimiento" })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await assertNoUnhandledApiCalls(runtime);
  });

  test("09 FOLLOW-UPS: detalle reprograma mantenimiento", async ({ page }) => {
    const runtime = await setupMocks(page);

    await page.goto("/follow-ups/fu-1");

    page.once("dialog", async (dialog) => {
      await dialog.accept(dateKeyWithOffset(5));
    });

    await page.getByRole("button", { name: "Reprogramar" }).click();

    await expect(page.getByText("Pospuesto")).toBeVisible();
    await expect(
      runtime.writeApiCalls.some(
        (item) => item === "PATCH /api/follow-ups/fu-1/postpone",
      ),
    ).toBe(true);

    await assertNoUnhandledApiCalls(runtime);
  });

  test("10 FOLLOW-UPS: detalle marca completado y guarda edición", async ({
    page,
  }) => {
    const runtime = await setupMocks(page);

    await page.goto("/follow-ups/fu-1");

    await page.getByRole("button", { name: "Marcar como completado" }).click();
    await expect(page.getByText("Ya completado")).toBeVisible();

    await page.getByRole("button", { name: "Editar" }).click();
    await page
      .getByPlaceholder("Descripción del mantenimiento")
      .fill("Mantenimiento actualizado desde E2E");
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(
      runtime.writeApiCalls.some((item) => item === "PUT /api/follow-ups/fu-1"),
    ).toBe(true);
    await expect(
      runtime.writeApiCalls.some(
        (item) => item === "PATCH /api/follow-ups/fu-1",
      ),
    ).toBe(true);

    await assertNoUnhandledApiCalls(runtime);
  });

  test("11 CALENDARIO: carga base con encabezado y stats", async ({ page }) => {
    const runtime = await setupMocks(page);

    await page.goto("/calendar");

    await expect(
      page.getByRole("heading", { name: "Calendario" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Hoy", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Vencidos", { exact: true })).toBeVisible();
    await expect(page.getByText("Próximos", { exact: true })).toBeVisible();

    await assertNoUnhandledApiCalls(runtime);
  });

  test("12 CALENDARIO: cambia vistas Mes/Semana/Día y vuelve a Hoy", async ({
    page,
  }) => {
    const runtime = await setupMocks(page);

    await page.goto("/calendar");

    await page.getByRole("button", { name: "Semana", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Semana", exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Día", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Día", exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Hoy", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Mes", exact: true }),
    ).toBeVisible();

    await assertNoUnhandledApiCalls(runtime);
  });

  test("13 CALENDARIO: guarda nota del día", async ({ page }) => {
    const runtime = await setupMocks(page);

    await page.goto("/calendar");

    await page
      .getByPlaceholder("Escribí una nota para esta fecha...")
      .fill("Nueva nota E2E calendario");
    await page.getByRole("button", { name: "Guardar nota" }).click();

    await expect(
      runtime.writeApiCalls.some((item) => item === "POST /api/calendar-notes"),
    ).toBe(true);

    await assertNoUnhandledApiCalls(runtime);
  });

  test("14 CALENDARIO: bloquea y desbloquea fecha seleccionada", async ({
    page,
  }) => {
    const runtime = await setupMocks(page);

    await page.goto("/calendar");

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    await page.getByRole("button", { name: "Bloquear fecha" }).click();
    await expect(
      page.getByRole("button", { name: "Desbloquear fecha" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Desbloquear fecha" }).click();

    await expect(
      runtime.writeApiCalls.some(
        (item) => item === "POST /api/calendar-blocked",
      ),
    ).toBe(true);
    await expect(
      runtime.writeApiCalls.some(
        (item) => item === "DELETE /api/calendar-blocked",
      ),
    ).toBe(true);

    await assertNoUnhandledApiCalls(runtime);
  });

  test("15 CALENDARIO: edita y elimina nota existente", async ({ page }) => {
    const runtime = await setupMocks(page);

    await page.goto("/calendar");

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    await page.getByRole("button", { name: "Día", exact: true }).click();

    await page
      .getByRole("button", { name: "Editar", exact: true })
      .first()
      .click();
    await page.locator("textarea").first().fill("Nota modificada desde E2E");
    await page
      .getByRole("button", { name: "Guardar", exact: true })
      .first()
      .click();

    await page
      .getByRole("button", { name: "Eliminar", exact: true })
      .first()
      .click();

    await expect(
      runtime.writeApiCalls.some((item) => item === "PUT /api/calendar-notes"),
    ).toBe(true);
    await expect(
      runtime.writeApiCalls.some(
        (item) => item === "DELETE /api/calendar-notes",
      ),
    ).toBe(true);

    await assertNoUnhandledApiCalls(runtime);
  });

  test("16 CENTRO OPERATIVO: carga día con resumen y lista", async ({
    page,
  }) => {
    const runtime = await setupMocks(page);

    await page.goto("/operations-center");

    await expect(
      page.getByRole("heading", { name: "Centro operativo" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Trabajos para visitar" }),
    ).toBeVisible();
    await expect(page.getByText("Capacidad configurada:")).toBeVisible();

    await assertNoUnhandledApiCalls(runtime);
  });

  test("17 CENTRO OPERATIVO: vista semana usa rango de 7 días", async ({
    page,
  }) => {
    const runtime = await setupMocks(page);

    await page.goto("/operations-center");

    await page.getByRole("button", { name: "Semana" }).click();

    await expect(
      page.getByText("Agrupaciones operativas por semana"),
    ).toBeVisible();
    await expect(runtime.calendarRangeRequests.length).toBeGreaterThan(0);

    const weekAvailabilityCall = runtime.availabilityRequests.find(
      (url) => url.searchParams.get("days") === "7",
    );

    expect(weekAvailabilityCall).toBeTruthy();

    await assertNoUnhandledApiCalls(runtime);
  });

  test("18 CENTRO OPERATIVO: vista mes usa rango mensual", async ({ page }) => {
    const runtime = await setupMocks(page);

    await page.goto("/operations-center");

    await page.getByRole("button", { name: "Mes" }).click();

    await expect(
      page.getByText("Agrupaciones operativas por mes"),
    ).toBeVisible();

    await expect
      .poll(() =>
        runtime.availabilityRequests.some((url) => {
          const days = Number(url.searchParams.get("days") || "0");
          return days >= 28;
        }),
      )
      .toBe(true);

    await assertNoUnhandledApiCalls(runtime);
  });

  test("19 CENTRO OPERATIVO: refresca lista y vuelve a consultar calendario", async ({
    page,
  }) => {
    const runtime = await setupMocks(page);

    await page.goto("/operations-center");

    const initialRequests = runtime.calendarRangeRequests.length;

    await page.getByRole("button", { name: "Refrescar" }).click();

    await expect
      .poll(() => runtime.calendarRangeRequests.length)
      .toBeGreaterThan(initialRequests);

    await expect(
      page.getByRole("heading", { name: "Trabajos para visitar" }),
    ).toBeVisible();

    await assertNoUnhandledApiCalls(runtime);
  });

  test("20 CENTRO OPERATIVO: usa agrupación como ruta", async ({ page }) => {
    const runtime = await setupMocks(page);

    await page.goto("/operations-center");

    const northGroup = page
      .locator("section")
      .filter({ hasText: "Zona Norte" });

    await northGroup
      .getByRole("button", {
        name: "Usar esta agrupación como ruta",
        exact: true,
      })
      .click();

    await expect(page.getByText("Paradas cargadas")).toBeVisible();

    await assertNoUnhandledApiCalls(runtime);
  });

  test("21 CENTRO OPERATIVO: valida error al abrir ruta sin datos", async ({
    page,
  }) => {
    const runtime = await setupMocks(page);

    await page.addInitScript(() => {
      (window as Window & { __openCalls?: unknown[] }).__openCalls = [];
      const nativeOpen = window.open;
      window.open = function (...args) {
        (window as Window & { __openCalls?: unknown[] }).__openCalls?.push(
          args,
        );
        return nativeOpen.apply(window, args as Parameters<typeof window.open>);
      };
    });

    await page.goto("/operations-center");

    await page
      .getByRole("button", { name: "Abrir ruta en Google Maps" })
      .click();

    await expect(
      page.getByText(
        "Ingrese un punto de salida y al menos una parada válida para abrir la ruta.",
      ),
    ).toBeVisible();

    const openCalls = await page.evaluate(() => {
      return (
        (window as Window & { __openCalls?: unknown[] }).__openCalls || []
      ).length;
    });

    expect(openCalls).toBe(0);

    await assertNoUnhandledApiCalls(runtime);
  });

  test("22 CENTRO OPERATIVO: abre Google Maps con ruta preparada", async ({
    page,
  }) => {
    const runtime = await setupMocks(page);

    await page.addInitScript(() => {
      (window as Window & { __openUrls?: string[] }).__openUrls = [];
      window.open = (url?: string | URL | undefined) => {
        if (typeof url === "string") {
          (window as Window & { __openUrls?: string[] }).__openUrls?.push(url);
        }
        return null;
      };
    });

    await page.goto("/operations-center");

    const northGroup = page
      .locator("section")
      .filter({ hasText: "Zona Norte" });

    await northGroup
      .getByRole("button", {
        name: "Usar esta agrupación como ruta",
        exact: true,
      })
      .click();

    await page
      .getByPlaceholder("Busque una dirección o punto de referencia")
      .fill("Oficina central");

    await page
      .getByRole("button", { name: "Abrir ruta en Google Maps" })
      .click();

    const openUrls = await page.evaluate(() => {
      return (window as Window & { __openUrls?: string[] }).__openUrls || [];
    });

    expect(openUrls.length).toBeGreaterThan(0);
    expect(openUrls[0]).toContain("google.com/maps/dir");

    await assertNoUnhandledApiCalls(runtime);
  });
});
