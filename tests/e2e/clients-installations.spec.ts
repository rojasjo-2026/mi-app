import { expect, test, type Page, type Route } from "@playwright/test";

type ClientRow = {
  client_id: string;
  first_name: string;
  last_name_1: string;
  last_name_2?: string | null;
  display_name?: string | null;
  phone_primary: string;
  email?: string | null;
  client_status?: string | null;
  whatsapp_opt_in?: boolean;
  admin_level_1?: string | null;
  admin_level_2?: string | null;
  admin_level_3?: string | null;
  operational_zone_id?: string | null;
  operational_zone?: { operational_zone_id: string; name: string } | null;
  maintenance_count?: number;
  installation_count?: number;
  pending_maintenance_count?: number;
  pending_invoice_count?: number;
  identification_type?: string | null;
  identification_number?: string | null;
};

type InstallationRow = {
  installation_id: string;
  installation_date: string;
  description: string;
  technician_name?: string | null;
  installation_status: "OPEN" | "IN_PROGRESS" | "CLOSED" | "CANCELLED";
  estimated_amount?: number | null;
  admin_level_1?: string | null;
  admin_level_2?: string | null;
  admin_level_3?: string | null;
  address_line?: string | null;
  operational_zone_id?: string | null;
  operational_zone?: { operational_zone_id: string; name: string } | null;
  client?: {
    client_id?: string | null;
    first_name?: string | null;
    last_name_1?: string | null;
    last_name_2?: string | null;
    phone_primary?: string | null;
  } | null;
  service_type?: {
    service_type_id?: number;
    name?: string | null;
    code?: string | null;
  } | null;
};

type MockOptions = {
  clientsGetStatus?: number;
  clientsGetSuccess?: boolean;
  clientsData?: ClientRow[];
  installationsGetStatus?: number;
  installationsGetSuccess?: boolean;
  installationsData?: InstallationRow[];
  onClientsGet?: (url: URL) => void;
  onInstallationsGet?: (url: URL) => void;
  onClientsPost?: (payload: unknown) => void;
  onInstallationsPost?: (payload: unknown) => void;
};

type MockRuntime = {
  unhandledApiCalls: string[];
  mapsScriptInterceptCount: number;
};

const clientsFixture: ClientRow[] = [
  {
    client_id: "client-1",
    first_name: "Ana",
    last_name_1: "Perez",
    display_name: "Ana Perez",
    phone_primary: "+50611111111",
    email: "ana@example.test",
    client_status: "ACTIVE",
    whatsapp_opt_in: true,
    admin_level_1: "San Jose",
    admin_level_2: "Central",
    operational_zone_id: "zone-1",
    operational_zone: {
      operational_zone_id: "zone-1",
      name: "Zona Norte",
    },
    maintenance_count: 2,
    installation_count: 1,
    pending_maintenance_count: 1,
    pending_invoice_count: 0,
    identification_type: "CEDULA_FISICA",
    identification_number: "123456789",
  },
  {
    client_id: "client-2",
    first_name: "Bruno",
    last_name_1: "Diaz",
    display_name: "Bruno Diaz",
    phone_primary: "+50622222222",
    email: "bruno@example.test",
    client_status: "INACTIVE",
    whatsapp_opt_in: false,
    admin_level_1: "Alajuela",
    admin_level_2: "Central",
    operational_zone_id: null,
    operational_zone: null,
    maintenance_count: 0,
    installation_count: 2,
    pending_maintenance_count: 0,
    pending_invoice_count: 1,
    identification_type: "CEDULA_FISICA",
    identification_number: "987654321",
  },
];

const installationsFixture: InstallationRow[] = [
  {
    installation_id: "inst-1",
    installation_date: "2026-07-20",
    description: "Edificio Norte",
    technician_name: "Carlos Soto",
    installation_status: "OPEN",
    estimated_amount: 100000,
    admin_level_1: "San Jose",
    admin_level_2: "Central",
    address_line: "Calle 1",
    operational_zone_id: "zone-1",
    operational_zone: {
      operational_zone_id: "zone-1",
      name: "Zona Norte",
    },
    client: {
      client_id: "client-1",
      first_name: "Ana",
      last_name_1: "Perez",
      phone_primary: "+50611111111",
    },
    service_type: {
      service_type_id: 1,
      code: "INSTALL",
      name: "Instalacion",
    },
  },
  {
    installation_id: "inst-2",
    installation_date: "2026-07-15",
    description: "Bodega Sur",
    technician_name: "Laura Mora",
    installation_status: "IN_PROGRESS",
    estimated_amount: 250000,
    admin_level_1: "Alajuela",
    admin_level_2: "Central",
    address_line: "Avenida 4",
    operational_zone_id: null,
    operational_zone: null,
    client: {
      client_id: "client-2",
      first_name: "Bruno",
      last_name_1: "Diaz",
      phone_primary: "+50622222222",
    },
    service_type: {
      service_type_id: 2,
      code: "REPAIR",
      name: "Reparacion",
    },
  },
];

const operationalZonesFixture = [
  {
    operational_zone_id: "zone-1",
    name: "Zona Norte",
    is_active: true,
  },
  {
    operational_zone_id: "zone-2",
    name: "Zona Sur",
    is_active: true,
  },
];

const serviceTypesFixture = [
  {
    service_type_id: 1,
    code: "INSTALL",
    name: "Instalacion",
  },
  {
    service_type_id: 2,
    code: "REPAIR",
    name: "Reparacion",
  },
];

const techniciansFixture = [
  {
    user_id: "tech-1",
    first_name: "Carlos",
    last_name_1: "Soto",
    last_name_2: null,
    role: "TECHNICIAN",
    is_active: true,
  },
];

function buildClientsResponse(data: ClientRow[]) {
  const active = data.filter((item) => item.client_status === "ACTIVE").length;
  const withWhatsApp = data.filter((item) => item.whatsapp_opt_in).length;

  return {
    success: true,
    data,
    pagination: {
      page: 1,
      pageSize: 15,
      totalItems: data.length,
      totalPages: 1,
    },
    metrics: {
      total: data.length,
      active,
      withWhatsApp,
      attention: Math.max(data.length - active, 0),
    },
  };
}

function buildInstallationsResponse(data: InstallationRow[]) {
  return {
    success: true,
    data,
    pagination: {
      page: 1,
      pageSize: 15,
      totalItems: data.length,
      totalPages: 1,
    },
    metrics: {
      total: data.length,
      open: data.filter((item) => item.installation_status === "OPEN").length,
      inProgress: data.filter(
        (item) => item.installation_status === "IN_PROGRESS",
      ).length,
      closed: data.filter((item) => item.installation_status === "CLOSED")
        .length,
      cancelled: data.filter((item) => item.installation_status === "CANCELLED")
        .length,
    },
  };
}

function filterClientsByQuery(data: ClientRow[], url: URL) {
  const search = (url.searchParams.get("search") || "").trim().toLowerCase();

  if (!search) {
    return data;
  }

  return data.filter((client) => {
    const fullName =
      `${client.first_name} ${client.last_name_1} ${client.last_name_2 || ""}`
        .trim()
        .toLowerCase();

    return (
      fullName.includes(search) ||
      (client.display_name || "").toLowerCase().includes(search) ||
      (client.phone_primary || "").toLowerCase().includes(search)
    );
  });
}

function filterInstallationsByQuery(data: InstallationRow[], url: URL) {
  const search = (url.searchParams.get("search") || "").trim().toLowerCase();
  const statusFilter = (url.searchParams.get("status") || "").trim();
  const operationalZoneFilter = (
    url.searchParams.get("operational_zone_id") || ""
  ).trim();

  let nextData = [...data];

  if (search) {
    nextData = nextData.filter((item) => {
      const clientName =
        `${item.client?.first_name || ""} ${item.client?.last_name_1 || ""}`
          .trim()
          .toLowerCase();

      return (
        (item.description || "").toLowerCase().includes(search) ||
        (item.technician_name || "").toLowerCase().includes(search) ||
        (item.service_type?.name || "").toLowerCase().includes(search) ||
        clientName.includes(search) ||
        (item.client?.phone_primary || "").toLowerCase().includes(search)
      );
    });
  }

  if (statusFilter) {
    nextData = nextData.filter(
      (item) => item.installation_status === statusFilter,
    );
  }

  if (operationalZoneFilter) {
    if (operationalZoneFilter === "without") {
      nextData = nextData.filter((item) => !item.operational_zone_id);
    } else {
      nextData = nextData.filter(
        (item) => item.operational_zone_id === operationalZoneFilter,
      );
    }
  }

  return nextData;
}

async function fulfillJson(route: Route, status: number, payload: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(payload),
  });
}

async function setupClientsInstallationsMocks(
  page: Page,
  options: MockOptions = {},
): Promise<MockRuntime> {
  const runtime: MockRuntime = {
    unhandledApiCalls: [],
    mapsScriptInterceptCount: 0,
  };

  const clientsData = options.clientsData ?? clientsFixture;
  const installationsData = options.installationsData ?? installationsFixture;

  await page.route(
    /https:\/\/maps\.googleapis\.com\/maps\/api\/js(?:\?.*)?$/,
    async (route) => {
      runtime.mapsScriptInterceptCount += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: "window.google = window.google || { maps: { places: { Autocomplete: function(){ return { addListener: function(){}, getPlace: function(){ return {}; } }; } } } };",
      });
    },
  );

  await page.route("**/api/**", async (route) => {
    const requestUrl = new URL(route.request().url());
    const method = route.request().method();
    const pathname = requestUrl.pathname;

    if (pathname === "/api/settings" && method === "GET") {
      await fulfillJson(route, 200, {
        success: true,
        data: {
          country_code: "CR",
          locale: "es-CR",
          currency_code: "CRC",
          time_zone: "America/Costa_Rica",
        },
      });
      return;
    }

    if (pathname === "/maps/api/js" && method === "GET") {
      runtime.mapsScriptInterceptCount += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: "window.google = window.google || { maps: { places: { Autocomplete: function(){ return { addListener: function(){}, getPlace: function(){ return {}; } }; } } } };",
      });
      return;
    }

    if (pathname === "/api/operational-zones" && method === "GET") {
      await fulfillJson(route, 200, {
        success: true,
        data: operationalZonesFixture,
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
            operational_zone_visit_date_id: "visit-1",
            operational_zone_id: "zone-1",
            visit_date: "2026-08-02",
            can_offer_day: true,
            reason: "Disponibilidad de cuadrilla",
          },
        ],
      });
      return;
    }

    if (pathname === "/api/service-types" && method === "GET") {
      await fulfillJson(route, 200, {
        success: true,
        data: serviceTypesFixture,
      });
      return;
    }

    if (pathname === "/api/users" && method === "GET") {
      await fulfillJson(route, 200, {
        success: true,
        data: techniciansFixture,
      });
      return;
    }

    if (pathname === "/api/clients" && method === "GET") {
      options.onClientsGet?.(requestUrl);

      const status = options.clientsGetStatus ?? 200;
      const success = options.clientsGetSuccess ?? true;

      if (!success || status >= 400) {
        await fulfillJson(route, status, {
          success: false,
          message: "Error loading clients",
          data: [],
        });
        return;
      }

      const filtered = filterClientsByQuery(clientsData, requestUrl);
      await fulfillJson(route, 200, buildClientsResponse(filtered));
      return;
    }

    if (pathname === "/api/clients" && method === "POST") {
      const payload = await route.request().postDataJSON();
      options.onClientsPost?.(payload);

      await fulfillJson(route, 201, {
        success: true,
        message: "Client created",
        data: {
          client_id: "client-new",
        },
      });
      return;
    }

    if (/^\/api\/clients\/[^/]+$/.test(pathname) && method === "GET") {
      const id = pathname.split("/").at(-1) || "";
      const foundClient = clientsData.find((item) => item.client_id === id);

      if (!foundClient) {
        await fulfillJson(route, 404, {
          success: false,
          message: "Client not found",
        });
        return;
      }

      await fulfillJson(route, 200, {
        success: true,
        data: {
          ...foundClient,
          installations: installationsData
            .filter((item) => item.client?.client_id === foundClient.client_id)
            .map((item) => ({
              installation_id: item.installation_id,
              description: item.description,
              installation_date: item.installation_date,
              city: item.admin_level_2 || null,
              zone: item.operational_zone?.name || null,
              installation_status: item.installation_status,
            })),
        },
      });
      return;
    }

    if (pathname === "/api/activity-logs" && method === "GET") {
      await fulfillJson(route, 200, {
        success: true,
        data: [],
      });
      return;
    }

    if (pathname === "/api/invoices" && method === "GET") {
      await fulfillJson(route, 200, {
        success: true,
        data: [],
      });
      return;
    }

    if (pathname === "/api/installations" && method === "GET") {
      options.onInstallationsGet?.(requestUrl);

      const status = options.installationsGetStatus ?? 200;
      const success = options.installationsGetSuccess ?? true;

      if (!success || status >= 400) {
        await fulfillJson(route, status, {
          success: false,
          message: "No se pudieron cargar las instalaciones",
          data: [],
        });
        return;
      }

      const filtered = filterInstallationsByQuery(
        installationsData,
        requestUrl,
      );
      await fulfillJson(route, 200, buildInstallationsResponse(filtered));
      return;
    }

    if (pathname === "/api/installations" && method === "POST") {
      const payload = await route.request().postDataJSON();
      options.onInstallationsPost?.(payload);

      await fulfillJson(route, 201, {
        success: true,
        data: {
          installation_id: "inst-new",
        },
      });
      return;
    }

    if (/^\/api\/installations\/[^/]+$/.test(pathname) && method === "GET") {
      const id = pathname.split("/").at(-1) || "";
      const foundInstallation = installationsData.find(
        (item) => item.installation_id === id,
      );

      if (!foundInstallation) {
        await fulfillJson(route, 404, {
          success: false,
          message: "Installation not found",
        });
        return;
      }

      await fulfillJson(route, 200, {
        success: true,
        data: {
          ...foundInstallation,
          is_active: true,
          follow_ups: [],
          change_logs: [],
          latitude: null,
          longitude: null,
          reference_point: null,
          location_notes: null,
          client: {
            client_id: foundInstallation.client?.client_id || "client-1",
            first_name: foundInstallation.client?.first_name || "Ana",
            last_name_1: foundInstallation.client?.last_name_1 || "Perez",
            last_name_2: foundInstallation.client?.last_name_2 || null,
            phone_primary: foundInstallation.client?.phone_primary || null,
            email: "cliente@example.test",
          },
          service_type: {
            service_type_id:
              foundInstallation.service_type?.service_type_id || 1,
            code: foundInstallation.service_type?.code || "INSTALL",
            name: foundInstallation.service_type?.name || "Instalacion",
          },
        },
      });
      return;
    }

    if (
      /^\/api\/installations\/[^/]+\/components$/.test(pathname) &&
      method === "GET"
    ) {
      await fulfillJson(route, 200, {
        success: true,
        data: [],
      });
      return;
    }

    if (
      /^\/api\/installations\/[^/]+\/technical-notes$/.test(pathname) &&
      method === "GET"
    ) {
      await fulfillJson(route, 200, []);
      return;
    }

    if (pathname === "/api/files" && method === "GET") {
      await fulfillJson(route, 200, {
        success: true,
        data: [],
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

async function expectNoUnhandledApis(runtime: MockRuntime) {
  expect(runtime.unhandledApiCalls).toEqual([]);
}

function inputNextToLabel(page: Page, labelText: string) {
  return page.locator(`label:has-text("${labelText}") + input`);
}

function selectNextToLabel(page: Page, labelText: string) {
  return page.locator(`label:has-text("${labelText}") + select`);
}

async function submitForm(page: Page) {
  await page.locator("form").evaluate((form) => {
    (form as HTMLFormElement).requestSubmit();
  });
}

test.describe("E2E /clients + /installations", () => {
  test("1. /clients carga correctamente", async ({ page }) => {
    const runtime = await setupClientsInstallationsMocks(page);

    await page.goto("/clients");

    await expect(
      page.getByRole("heading", { name: "Clientes", exact: true }),
    ).toBeVisible();
    await expectNoUnhandledApis(runtime);
  });

  test("2. una sola solicitud inicial a /api/clients", async ({ page }) => {
    let clientsGetCalls = 0;

    const runtime = await setupClientsInstallationsMocks(page, {
      onClientsGet: () => {
        clientsGetCalls += 1;
      },
    });

    await page.goto("/clients");

    await expect.poll(() => clientsGetCalls, { timeout: 15000 }).toBe(1);

    await expectNoUnhandledApis(runtime);
  });

  test("3. se muestran clientes simulados", async ({ page }) => {
    const runtime = await setupClientsInstallationsMocks(page);

    await page.goto("/clients");

    await expect(
      page.getByRole("button", {
        name: "Abrir perfil de Ana Perez",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: "Abrir perfil de Bruno Diaz",
        exact: true,
      }),
    ).toBeVisible();

    await expectNoUnhandledApis(runtime);
  });

  test("4. búsqueda filtra por nombre o teléfono", async ({ page }) => {
    const runtime = await setupClientsInstallationsMocks(page);

    await page.goto("/clients");

    const searchInput = page.getByPlaceholder("Buscar clientes...");

    await searchInput.fill("Ana");

    await expect(
      page.getByRole("button", {
        name: "Abrir perfil de Ana Perez",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: "Abrir perfil de Bruno Diaz",
        exact: true,
      }),
    ).toHaveCount(0);

    await searchInput.fill("2222");

    await expect(
      page.getByRole("button", {
        name: "Abrir perfil de Bruno Diaz",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: "Abrir perfil de Ana Perez",
        exact: true,
      }),
    ).toHaveCount(0);

    await expectNoUnhandledApis(runtime);
  });

  test("5. estado vacío de clientes", async ({ page }) => {
    const runtime = await setupClientsInstallationsMocks(page, {
      clientsData: [],
    });

    await page.goto("/clients");

    await expect(
      page.getByText("No se encontraron clientes", { exact: true }),
    ).toBeVisible();
    await expectNoUnhandledApis(runtime);
  });

  test("6. estado de error de clientes", async ({ page }) => {
    const runtime = await setupClientsInstallationsMocks(page, {
      clientsGetStatus: 500,
      clientsGetSuccess: false,
    });

    await page.goto("/clients");

    await expect(
      page.getByText("No se pudieron cargar los clientes", { exact: true }),
    ).toBeVisible();
    await expectNoUnhandledApis(runtime);
  });

  test("7. abrir cliente navega al detalle correcto", async ({ page }) => {
    const runtime = await setupClientsInstallationsMocks(page);

    await page.goto("/clients");

    await page
      .getByRole("button", { name: "Abrir perfil de Ana Perez", exact: true })
      .click();
    await page.getByRole("link", { name: "Ver detalle", exact: true }).click();

    await expect(page).toHaveURL(/\/clients\/client-1$/);
    await expectNoUnhandledApis(runtime);
  });

  test("8. /clients/new muestra formulario", async ({ page }) => {
    const runtime = await setupClientsInstallationsMocks(page);

    await page.goto("/clients/new");

    await expect(
      page.getByRole("heading", { name: "Crear cliente", exact: true }),
    ).toBeVisible();
    await expect(
      inputNextToLabel(page, "Teléfono principal / WhatsApp *"),
    ).toBeVisible();

    await expectNoUnhandledApis(runtime);
  });

  test("9. cliente válido ejecuta POST simulado", async ({ page }) => {
    const postedClients: unknown[] = [];

    const runtime = await setupClientsInstallationsMocks(page, {
      onClientsPost: (payload) => {
        postedClients.push(payload);
      },
    });

    await page.goto("/clients/new");

    await inputNextToLabel(page, "Nombre *").fill("Lucia");
    await inputNextToLabel(page, "Primer apellido *").fill("Mora");
    await inputNextToLabel(page, "Identificación fiscal / legal *").fill(
      "123456789",
    );
    await inputNextToLabel(page, "Teléfono principal / WhatsApp *").fill(
      "+50688888888",
    );

    await submitForm(page);

    await expect(
      page.getByText("Cliente creado correctamente", { exact: true }),
    ).toBeVisible();
    await expect.poll(() => postedClients.length, { timeout: 5000 }).toBe(1);

    await expectNoUnhandledApis(runtime);
  });

  test("10. obligatorios de cliente muestran validación", async ({ page }) => {
    const postedClients: unknown[] = [];

    const runtime = await setupClientsInstallationsMocks(page, {
      onClientsPost: (payload) => {
        postedClients.push(payload);
      },
    });

    await page.goto("/clients/new");
    await submitForm(page);

    const firstValidationMessage = await inputNextToLabel(
      page,
      "Nombre *",
    ).evaluate((input) => {
      const element = input as HTMLInputElement;
      return element.validationMessage;
    });

    expect(firstValidationMessage.length).toBeGreaterThan(0);
    expect(postedClients).toEqual([]);
    await expectNoUnhandledApis(runtime);
  });

  test("11. /installations carga correctamente", async ({ page }) => {
    const runtime = await setupClientsInstallationsMocks(page);

    await page.goto("/installations");

    await expect(
      page.getByRole("heading", { name: "Instalaciones", exact: true }),
    ).toBeVisible();
    await expectNoUnhandledApis(runtime);
  });

  test("12. se muestran instalaciones simuladas", async ({ page }) => {
    const runtime = await setupClientsInstallationsMocks(page);

    await page.goto("/installations");

    await expect(
      page.getByRole("link", { name: "Edificio Norte", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Bodega Sur", exact: true }),
    ).toBeVisible();
    await expectNoUnhandledApis(runtime);
  });

  test("13. búsqueda y filtros de instalaciones funcionan", async ({
    page,
  }) => {
    const runtime = await setupClientsInstallationsMocks(page);

    await page.goto("/installations");

    await page
      .getByPlaceholder(
        "Buscar por cliente, descripción, técnico, servicio, ubicación o código...",
      )
      .fill("Bodega");

    await expect(
      page.getByRole("link", { name: "Bodega Sur", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Edificio Norte", exact: true }),
    ).toHaveCount(0);

    await page
      .getByRole("button", { name: "En proceso 1", exact: true })
      .click();

    await expect(
      page.getByRole("link", { name: "Bodega Sur", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Edificio Norte", exact: true }),
    ).toHaveCount(0);

    await page
      .getByRole("combobox", {
        name: "Filtrar por zona operativa",
        exact: true,
      })
      .selectOption("without");

    await expect(
      page.getByRole("link", { name: "Bodega Sur", exact: true }),
    ).toBeVisible();
    await expectNoUnhandledApis(runtime);
  });

  test("14. abrir instalación navega al detalle correcto", async ({ page }) => {
    const runtime = await setupClientsInstallationsMocks(page);

    await page.goto("/installations");

    await page.locator('a[href="/installations/inst-1"]').click();

    await expect(page).toHaveURL(/\/installations\/inst-1$/);
    await expectNoUnhandledApis(runtime);
  });

  test("15. /installations/new carga zonas y tipos simulados", async ({
    page,
  }) => {
    const runtime = await setupClientsInstallationsMocks(page);

    await page.goto("/installations/new");

    await expect(
      page.getByRole("heading", { name: "Nueva instalación", exact: true }),
    ).toBeVisible();

    const serviceTypeSelect = selectNextToLabel(page, "Tipo de servicio *");
    await expect(serviceTypeSelect).toBeVisible();
    await expect(serviceTypeSelect).toContainText("Instalacion");

    await page.getByRole("button", { name: /Ubicación/ }).click();

    const operationalZoneSelect = page.locator("#operational-zone-select");
    await expect(operationalZoneSelect).toBeVisible();
    await expect(operationalZoneSelect).toContainText("Zona Norte");

    await expectNoUnhandledApis(runtime);
  });

  test("16. crear instalación válida ejecuta POST simulado", async ({
    page,
  }) => {
    const postedInstallations: unknown[] = [];

    const runtime = await setupClientsInstallationsMocks(page, {
      onInstallationsPost: (payload) => {
        postedInstallations.push(payload);
      },
    });

    page.on("dialog", async (dialog) => {
      await dialog.dismiss();
    });

    await page.goto("/installations/new");

    await page.getByPlaceholder("Buscar por nombre o teléfono").fill("Ana");
    await page.getByRole("button", { name: /Ana Perez/ }).click();

    await selectNextToLabel(page, "Tipo de servicio *").selectOption("1");
    await inputNextToLabel(page, "Fecha *").fill("2026-08-01");

    await page.getByRole("button", { name: /Ubicación/ }).click();
    await page.locator("#operational-zone-select").selectOption("zone-1");

    await page
      .getByRole("button", { name: "Guardar instalación", exact: true })
      .click();

    await expect(
      page.getByText("Instalación creada correctamente", { exact: true }),
    ).toBeVisible();
    await expect
      .poll(() => postedInstallations.length, { timeout: 5000 })
      .toBe(1);

    await expectNoUnhandledApis(runtime);
  });

  test("17. obligatorios de instalación muestran validación", async ({
    page,
  }) => {
    const postedInstallations: unknown[] = [];

    const runtime = await setupClientsInstallationsMocks(page, {
      onInstallationsPost: (payload) => {
        postedInstallations.push(payload);
      },
    });

    await page.goto("/installations/new");

    await page
      .getByRole("button", { name: "Guardar instalación", exact: true })
      .click();

    await expect(
      page.getByText("Faltan campos obligatorios", { exact: true }),
    ).toBeVisible();
    expect(postedInstallations).toEqual([]);
    await expectNoUnhandledApis(runtime);
  });

  test("18. Google Maps permanece interceptado sin acceso real", async ({
    page,
  }) => {
    const runtime = await setupClientsInstallationsMocks(page);

    await page.goto("/installations/new");

    await expect
      .poll(() => runtime.mapsScriptInterceptCount, { timeout: 5000 })
      .toBeGreaterThan(0);

    await expectNoUnhandledApis(runtime);
  });
});
