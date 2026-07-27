import { expect, test, type Page, type Route } from "@playwright/test";

type ContactFlowStatus =
  | "PENDING"
  | "MESSAGE_SENT"
  | "WAITING_RESPONSE"
  | "OPTIONS_SENT"
  | "DATE_SELECTED"
  | "CONFIRMED"
  | "MANUAL_REQUIRED"
  | "NO_RESPONSE"
  | "REJECTED"
  | "CLOSED";

type FlowInput = {
  id: string;
  status: ContactFlowStatus;
  clientName: string;
  phone: string;
  installation: string;
  reason: string;
  unread: number;
  zoneId: string | null;
  zoneName: string | null;
};

type FlowsPayload = {
  success: boolean;
  data: ReturnType<typeof buildFlow>[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  metrics: {
    all: number;
    unread: number;
    waiting: number;
    confirmed: number;
    manual: number;
  };
};

type MockOptions = {
  flowStatus?: number;
  flowDelayMs?: number;
  flowsPayload?: FlowsPayload;
  onContactFlowsRequest?: (url: URL) => void;
  messageStatus?: number;
  messageDelayMs?: number;
  messagesPayload?: {
    success: boolean;
    data: unknown[];
  };
  onMessagesRequest?: () => void;
};

const IMAGE_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9sPE95sAAAAASUVORK5CYII=";

function buildFlow(input: FlowInput) {
  const [firstName, lastName1 = ""] = input.clientName.split(" ");

  return {
    contact_flow_id: input.id,
    status: input.status,
    trigger_date: "2026-07-26T10:00:00.000Z",
    selected_date: null,
    first_message_sent_at: "2026-07-26T10:05:00.000Z",
    last_message_at: "2026-07-26T10:10:00.000Z",
    requires_manual_action: input.status === "MANUAL_REQUIRED",
    manual_reason: input.status === "MANUAL_REQUIRED" ? "Revisar" : null,
    unread_count: input.unread,
    has_unread_messages: input.unread > 0,
    client: {
      client_id: `client-${input.id}`,
      first_name: firstName,
      last_name_1: lastName1,
      last_name_2: null,
      phone_primary: input.phone,
      operational_zone_id: input.zoneId,
      operational_zone: input.zoneId
        ? {
            operational_zone_id: input.zoneId,
            name: input.zoneName,
          }
        : null,
    },
    installation: {
      installation_id: `inst-${input.id}`,
      description: input.installation,
      operational_zone_id: input.zoneId,
      operational_zone: input.zoneId
        ? {
            operational_zone_id: input.zoneId,
            name: input.zoneName,
          }
        : null,
    },
    follow_up: {
      follow_up_id: `fu-${input.id}`,
      target_date: "2026-08-01T09:00:00.000Z",
      scheduled_date: null,
      reason: input.reason,
      priority: 2,
      operational_zone_id: input.zoneId,
      operational_zone: input.zoneId
        ? {
            operational_zone_id: input.zoneId,
            name: input.zoneName,
          }
        : null,
      follow_up_status: {
        follow_up_status_id: 1,
        code: "pending",
        name: "Pendiente",
        is_active: true,
      },
    },
    last_message: {
      message_id: `msg-${input.id}`,
      direction: "INBOUND",
      message_text: `Mensaje de ${input.clientName}`,
      message_type: "text",
      delivery_status: "delivered",
      metadata: null,
      created_at: "2026-07-26T10:09:00.000Z",
      sent_at: null,
      received_at: "2026-07-26T10:09:00.000Z",
    },
  };
}

const baseFlows = [
  buildFlow({
    id: "flow-1",
    status: "WAITING_RESPONSE",
    clientName: "Ana Perez",
    phone: "+50611111111",
    installation: "Edificio Norte",
    reason: "Mantenimiento ascensor",
    unread: 2,
    zoneId: "zone-1",
    zoneName: "Zona Norte",
  }),
  buildFlow({
    id: "flow-2",
    status: "CONFIRMED",
    clientName: "Bruno Diaz",
    phone: "+50622222222",
    installation: "Bodega Sur",
    reason: "Revisión anual",
    unread: 0,
    zoneId: null,
    zoneName: null,
  }),
];

function buildFlowsPayload(data: ReturnType<typeof buildFlow>[]): FlowsPayload {
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
      all: data.length,
      unread: data.filter((item) => (item.unread_count || 0) > 0).length,
      waiting: data.filter((item) => item.status === "WAITING_RESPONSE").length,
      confirmed: data.filter((item) => item.status === "CONFIRMED").length,
      manual: data.filter((item) => item.status === "MANUAL_REQUIRED").length,
    },
  };
}

function buildMessages() {
  return [
    {
      message_id: "m-1",
      contact_flow_id: "flow-1",
      direction: "INBOUND",
      message_text: "Buenos días",
      message_type: "text",
      delivery_status: "delivered",
      metadata: null,
      sent_at: null,
      received_at: "2026-07-26T10:00:00.000Z",
      created_at: "2026-07-26T10:00:00.000Z",
    },
    {
      message_id: "m-2",
      contact_flow_id: "flow-1",
      direction: "OUTBOUND",
      message_text: "Foto de evidencia",
      message_type: "image",
      delivery_status: "sent",
      metadata: {
        mediaUrl: IMAGE_DATA_URL,
        filename: "foto-evidencia.png",
      },
      sent_at: "2026-07-26T10:02:00.000Z",
      received_at: null,
      created_at: "2026-07-26T10:02:00.000Z",
    },
    {
      message_id: "m-3",
      contact_flow_id: "flow-1",
      direction: "OUTBOUND",
      message_text: "Adjunto PDF",
      message_type: "document",
      delivery_status: "sent",
      metadata: {
        mediaUrl: "https://example.test/documento.pdf",
        filename: "orden-trabajo.pdf",
      },
      sent_at: "2026-07-26T10:03:00.000Z",
      received_at: null,
      created_at: "2026-07-26T10:03:00.000Z",
    },
  ];
}

async function fulfillJson(route: Route, status: number, payload: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(payload),
  });
}

async function setupExternalDependencyMocks(page: Page) {
  await page.route(
    /https:\/\/maps\.googleapis\.com\/maps\/api\/js(?:\?.*)?$/,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: "window.google = window.google || { maps: {} };",
      });
    },
  );
}

async function setupContactAttemptsApiMocks(
  page: Page,
  options: MockOptions = {},
) {
  await setupExternalDependencyMocks(page);

  const flowStatus = options.flowStatus ?? 200;
  const messageStatus = options.messageStatus ?? 200;
  const flowDelayMs = options.flowDelayMs ?? 0;
  const messageDelayMs = options.messageDelayMs ?? 0;
  const flowsPayload = options.flowsPayload ?? buildFlowsPayload(baseFlows);
  const messagesPayload = options.messagesPayload ?? {
    success: true,
    data: buildMessages(),
  };

  await page.route("**/api/**", async (route) => {
    const requestUrl = new URL(route.request().url());
    const pathname = requestUrl.pathname;

    if (pathname === "/api/settings") {
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

    if (pathname === "/api/operational-zones") {
      await fulfillJson(route, 200, {
        success: true,
        data: [
          {
            operational_zone_id: "zone-1",
            name: "Zona Norte",
            is_active: true,
          },
        ],
      });
      return;
    }

    if (pathname === "/api/contact-flows") {
      options.onContactFlowsRequest?.(requestUrl);

      if (flowDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, flowDelayMs));
      }

      await fulfillJson(route, flowStatus, flowsPayload);
      return;
    }

    if (/^\/api\/contact-flows\/[^/]+\/messages$/.test(pathname)) {
      options.onMessagesRequest?.();

      if (messageDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, messageDelayMs));
      }

      await fulfillJson(route, messageStatus, messagesPayload);
      return;
    }

    await fulfillJson(route, 404, {
      success: false,
      message: `Mock not configured for ${pathname}`,
    });
  });
}

test.describe("/contact-attempts", () => {
  test("carga, request inicial, búsqueda, estado, orden, panel y conversación con media", async ({
    page,
  }) => {
    await setupExternalDependencyMocks(page);

    const contactFlowsRoute = /\/api\/contact-flows(?:\?.*)?$/;
    const operationalZonesRoute = /\/api\/operational-zones(?:\?.*)?$/;
    let contactFlowsRequests = 0;
    let operationalZonesRequests = 0;

    const contactFlowsResponseBody = buildFlowsPayload(baseFlows);
    const operationalZonesResponseBody = {
      success: true,
      data: [
        {
          operational_zone_id: "zone-1",
          name: "Zona Norte",
          is_active: true,
        },
      ],
    };

    page.on("requestfailed", (request) => {
      console.log(
        "[REQUEST FAILED]",
        request.method(),
        request.url(),
        request.failure(),
      );
    });

    page.on("pageerror", (error) => {
      console.log("[PAGE ERROR]", error.message);
    });

    await page.route(contactFlowsRoute, async (route) => {
      contactFlowsRequests += 1;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(contactFlowsResponseBody),
      });
    });

    await page.route(operationalZonesRoute, async (route) => {
      operationalZonesRequests += 1;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(operationalZonesResponseBody),
      });
    });

    await page.goto("/contact-attempts", {
      waitUntil: "domcontentloaded",
    });

    await expect
      .poll(() => contactFlowsRequests, {
        timeout: 15000,
      })
      .toBe(1);

    await expect
      .poll(() => operationalZonesRequests, {
        timeout: 15000,
      })
      .toBe(1);

    await expect(
      page.getByRole("heading", { name: "Intentos de contacto" }),
    ).toBeVisible();

    const anaRow = page.locator('[data-contact-attempt-row="true"]').filter({
      has: page.getByText("Ana Perez", { exact: true }),
    });

    const brunoRow = page.locator('[data-contact-attempt-row="true"]').filter({
      has: page.getByText("Bruno Diaz", { exact: true }),
    });

    await expect(anaRow).toHaveCount(1);
    await expect(brunoRow).toHaveCount(1);

    await expect(anaRow).toBeVisible();
    await expect(brunoRow).toBeVisible();
  });

  test("polling de conversación: no se duplica y se detiene al cerrar", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const originalSetInterval = window.setInterval;
      window.setInterval = ((
        handler: TimerHandler,
        timeout?: number,
        ...args: unknown[]
      ) => {
        const resolvedTimeout = timeout === 5000 ? 200 : timeout;
        return originalSetInterval(handler, resolvedTimeout, ...(args as []));
      }) as typeof window.setInterval;
    });

    let messagesCalls = 0;

    await setupContactAttemptsApiMocks(page, {
      flowsPayload: buildFlowsPayload([baseFlows[0]]),
      onMessagesRequest: () => {
        messagesCalls += 1;
      },
    });

    const anaRow = page.locator('[data-contact-attempt-row="true"]').filter({
      has: page.getByText("Ana Perez", { exact: true }),
    });

    await page.goto("/contact-attempts");
    await expect(anaRow).toHaveCount(1);
    await anaRow.click();
    await page.getByRole("button", { name: "Ver conversación" }).click();

    await expect
      .poll(() => messagesCalls, { timeout: 3000 })
      .toBeGreaterThanOrEqual(3);

    const callsAfterPolling = messagesCalls;

    await page.getByRole("button", { name: "Cerrar", exact: true }).click();

    await expect
      .poll(() => messagesCalls, { timeout: 1200 })
      .toBe(callsAfterPolling);
  });

  test("estado vacío en listado", async ({ page }) => {
    await setupContactAttemptsApiMocks(page, {
      flowsPayload: buildFlowsPayload([]),
    });

    await page.goto("/contact-attempts");

    await expect(
      page.getByText(
        "No hay contactos para mostrar con el filtro seleccionado.",
      ),
    ).toBeVisible();
  });

  test("estado de error en listado", async ({ page }) => {
    await setupContactAttemptsApiMocks(page, {
      flowStatus: 500,
      flowsPayload: {
        success: false,
        data: [],
        pagination: { page: 1, pageSize: 15, totalItems: 0, totalPages: 1 },
        metrics: { all: 0, unread: 0, waiting: 0, confirmed: 0, manual: 0 },
      },
    });

    await page.goto("/contact-attempts");

    await expect(
      page.getByText("No se pudo cargar la gestión de contactos."),
    ).toBeVisible();
  });

  test("estado loading inicial en listado", async ({ page }) => {
    await setupContactAttemptsApiMocks(page, {
      flowDelayMs: 450,
      flowsPayload: buildFlowsPayload([baseFlows[0]]),
    });

    const anaRow = page.locator('[data-contact-attempt-row="true"]').filter({
      has: page.getByText("Ana Perez", { exact: true }),
    });

    await page.goto("/contact-attempts");

    await expect(page.getByText("Cargando contactos...")).toBeVisible();
    await expect(anaRow).toHaveCount(1);
    await expect(anaRow).toBeVisible();
  });

  test("estado vacío y error de conversación", async ({ page }) => {
    await setupContactAttemptsApiMocks(page, {
      flowsPayload: buildFlowsPayload([baseFlows[0]]),
      messagesPayload: {
        success: true,
        data: [],
      },
    });

    const anaRow = page.locator('[data-contact-attempt-row="true"]').filter({
      has: page.getByText("Ana Perez", { exact: true }),
    });

    await page.goto("/contact-attempts");
    await expect(anaRow).toHaveCount(1);
    await anaRow.click();
    await page.getByRole("button", { name: "Ver conversación" }).click();

    await expect(
      page.getByText("No hay mensajes registrados para este flujo."),
    ).toBeVisible();

    await page.getByRole("button", { name: "Cerrar", exact: true }).click();

    await page.unroute("**/api/**");

    await setupContactAttemptsApiMocks(page, {
      flowsPayload: buildFlowsPayload([baseFlows[0]]),
      messageStatus: 500,
      messagesPayload: {
        success: false,
        data: [],
      },
    });

    await expect(anaRow).toHaveCount(1);
    await anaRow.click();
    await page.getByRole("button", { name: "Ver conversación" }).click();

    await expect(
      page.getByText("No se pudo cargar la conversación."),
    ).toBeVisible();
  });
});
