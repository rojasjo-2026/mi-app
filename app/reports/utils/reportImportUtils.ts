import type { ClientImportRowInput, ImportPreviewRow } from "../types";

const VALID_CURRENCIES = [
  "ARS",
  "BOB",
  "BRL",
  "CAD",
  "CLP",
  "COP",
  "CRC",
  "DOP",
  "EUR",
  "GTQ",
  "HNL",
  "MXN",
  "NIO",
  "PEN",
  "PYG",
  "USD",
  "UYU",
  "VES",
  "XAF",
];

const TEMPLATE_COLUMNS = [
  { key: "client_type", label: "Tipo de cliente" },
  { key: "first_name", label: "Nombre" },
  { key: "last_name_1", label: "Primer apellido" },
  { key: "last_name_2", label: "Segundo apellido" },
  { key: "company_name", label: "Razón social / Empresa" },
  { key: "commercial_name", label: "Nombre comercial" },
  { key: "main_contact_name", label: "Contacto principal" },
  { key: "phone_primary", label: "Teléfono principal" },
  { key: "phone_secondary", label: "Teléfono secundario" },
  { key: "email", label: "Correo electrónico" },
  { key: "client_status", label: "Estado del cliente" },
  { key: "whatsapp_opt_in", label: "WhatsApp habilitado" },
  { key: "auto_contact_enabled", label: "Contacto automático" },
  { key: "country_code", label: "País" },
  { key: "admin_level_1", label: "Provincia / Región" },
  { key: "admin_level_2", label: "Cantón / Ciudad" },
  { key: "admin_level_3", label: "Distrito / Zona" },
  { key: "address_line", label: "Dirección" },
  { key: "reference_point", label: "Punto de referencia" },
  { key: "location_notes", label: "Notas de ubicación" },
  { key: "zone", label: "Zona" },
  { key: "tax_id", label: "Identificación fiscal" },
  { key: "identification_country", label: "País de identificación" },
  { key: "identification_type", label: "Tipo de identificación" },
  { key: "identification_number", label: "Número de identificación" },
  { key: "tax_exempt", label: "Exento de impuestos" },
  { key: "billing_name", label: "Nombre de facturación" },
  { key: "billing_email", label: "Correo de facturación" },
  { key: "billing_phone", label: "Teléfono de facturación" },
  { key: "billing_address", label: "Dirección de facturación" },
  { key: "default_payment_term", label: "Condición de pago" },
  { key: "default_credit_days", label: "Días de crédito" },
  { key: "preferred_currency", label: "Moneda" },
] as const;

const HEADER_ALIASES: Record<string, string> = {
  client_type: "client_type",
  tipo_de_cliente: "client_type",
  tipo_cliente: "client_type",

  first_name: "first_name",
  nombre: "first_name",

  last_name_1: "last_name_1",
  primer_apellido: "last_name_1",
  apellido_1: "last_name_1",

  last_name_2: "last_name_2",
  segundo_apellido: "last_name_2",
  apellido_2: "last_name_2",

  company_name: "company_name",
  razon_social_empresa: "company_name",
  razon_social: "company_name",
  empresa: "company_name",

  commercial_name: "commercial_name",
  nombre_comercial: "commercial_name",

  main_contact_name: "main_contact_name",
  contacto_principal: "main_contact_name",

  phone_primary: "phone_primary",
  telefono_principal: "phone_primary",
  telefono: "phone_primary",

  phone_secondary: "phone_secondary",
  telefono_secundario: "phone_secondary",

  email: "email",
  correo_electronico: "email",
  correo: "email",

  client_status: "client_status",
  estado_del_cliente: "client_status",
  estado: "client_status",

  whatsapp_opt_in: "whatsapp_opt_in",
  whatsapp_habilitado: "whatsapp_opt_in",
  whatsapp: "whatsapp_opt_in",

  auto_contact_enabled: "auto_contact_enabled",
  contacto_automatico: "auto_contact_enabled",

  country_code: "country_code",
  pais: "country_code",

  admin_level_1: "admin_level_1",
  provincia_region: "admin_level_1",
  provincia: "admin_level_1",
  region: "admin_level_1",

  admin_level_2: "admin_level_2",
  canton_ciudad: "admin_level_2",
  canton: "admin_level_2",
  ciudad: "admin_level_2",

  admin_level_3: "admin_level_3",
  distrito_zona: "admin_level_3",
  distrito: "admin_level_3",

  address_line: "address_line",
  direccion: "address_line",

  reference_point: "reference_point",
  punto_de_referencia: "reference_point",

  location_notes: "location_notes",
  notas_de_ubicacion: "location_notes",

  zone: "zone",
  zona: "zone",

  tax_id: "tax_id",
  identificacion_fiscal: "tax_id",

  identification_country: "identification_country",
  pais_de_identificacion: "identification_country",

  identification_type: "identification_type",
  tipo_de_identificacion: "identification_type",

  identification_number: "identification_number",
  numero_de_identificacion: "identification_number",

  tax_exempt: "tax_exempt",
  exento_de_impuestos: "tax_exempt",
  exento: "tax_exempt",

  billing_name: "billing_name",
  nombre_de_facturacion: "billing_name",

  billing_email: "billing_email",
  correo_de_facturacion: "billing_email",

  billing_phone: "billing_phone",
  telefono_de_facturacion: "billing_phone",

  billing_address: "billing_address",
  direccion_de_facturacion: "billing_address",

  default_payment_term: "default_payment_term",
  condicion_de_pago: "default_payment_term",

  default_credit_days: "default_credit_days",
  dias_de_credito: "default_credit_days",

  preferred_currency: "preferred_currency",
  moneda: "preferred_currency",
};

function downloadWorkbookBuffer(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  window.URL.revokeObjectURL(url);
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\/+/g, " ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getCanonicalKey(header: string) {
  const normalizedHeader = normalizeHeader(header);

  return HEADER_ALIASES[normalizedHeader] ?? normalizedHeader;
}

function normalizeTextValue(value: unknown) {
  if (value === null || value === undefined) return "";

  return String(value).trim();
}

function normalizeChoice(value: unknown) {
  return normalizeTextValue(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizeImportValue(key: string, value: unknown) {
  const rawValue = normalizeTextValue(value);
  const normalized = normalizeChoice(value);

  if (!rawValue) return "";

  if (key === "client_type") {
    const map: Record<string, string> = {
      persona: "PERSON",
      person: "PERSON",
      empresa: "COMPANY",
      company: "COMPANY",
      compania: "COMPANY",
      otro: "OTHER",
      other: "OTHER",
    };

    return map[normalized] ?? rawValue.toUpperCase();
  }

  if (key === "client_status") {
    const map: Record<string, string> = {
      activo: "ACTIVE",
      active: "ACTIVE",
      prospecto: "PROSPECT",
      prospect: "PROSPECT",
      en_espera: "ON_HOLD",
      espera: "ON_HOLD",
      on_hold: "ON_HOLD",
      inactivo: "INACTIVE",
      inactive: "INACTIVE",
    };

    return (
      map[normalized.replace(/[^a-z0-9]+/g, "_")] ?? rawValue.toUpperCase()
    );
  }

  if (
    key === "whatsapp_opt_in" ||
    key === "auto_contact_enabled" ||
    key === "tax_exempt"
  ) {
    const map: Record<string, string> = {
      si: "true",
      s: "true",
      true: "true",
      1: "true",
      yes: "true",
      no: "false",
      n: "false",
      false: "false",
      0: "false",
    };

    return map[normalized] ?? rawValue;
  }

  if (key === "default_payment_term") {
    const map: Record<string, string> = {
      contado: "CASH",
      cash: "CASH",
      credito: "CREDIT",
      credit: "CREDIT",
    };

    return map[normalized] ?? rawValue.toUpperCase();
  }

  if (
    key === "preferred_currency" ||
    key === "country_code" ||
    key === "identification_country" ||
    key === "identification_type"
  ) {
    return rawValue.toUpperCase();
  }

  return rawValue;
}

export async function buildClientTemplateExcel() {
  const ExcelJS = await import("exceljs");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CLARIUS";
  workbook.created = new Date();

  const clientsSheet = workbook.addWorksheet("Clientes", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const instructionsSheet = workbook.addWorksheet("Instrucciones");

  const headers = TEMPLATE_COLUMNS.map((column) => column.label);

  const sample = [
    "Persona",
    "Adrian",
    "Rojas",
    "Segovia",
    "",
    "",
    "",
    "+50612345677",
    "",
    "cliente@demo.com",
    "Activo",
    "Sí",
    "Sí",
    "CR",
    "San José",
    "San José",
    "Catedral",
    "Dirección de ejemplo",
    "",
    "",
    "Zona Central",
    "101110111",
    "CR",
    "CÉDULA",
    "101110111",
    "No",
    "",
    "",
    "",
    "",
    "Contado",
    "",
    "CRC",
  ];

  clientsSheet.addRow(headers);
  clientsSheet.addRow(sample);

  clientsSheet.getRow(1).height = 24;
  clientsSheet.getRow(1).eachCell((cell) => {
    cell.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F172A" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  });

  clientsSheet.getRow(2).eachCell((cell) => {
    cell.alignment = {
      vertical: "middle",
      wrapText: true,
    };
  });

  clientsSheet.columns = headers.map((header) => ({
    width: Math.min(Math.max(header.length + 6, 18), 36),
  }));

  for (let rowNumber = 2; rowNumber <= 501; rowNumber += 1) {
    clientsSheet.getCell(`A${rowNumber}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"Persona,Empresa,Otro"'],
    };

    clientsSheet.getCell(`K${rowNumber}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"Activo,Prospecto,En espera,Inactivo"'],
    };

    clientsSheet.getCell(`L${rowNumber}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"Sí,No"'],
    };

    clientsSheet.getCell(`M${rowNumber}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"Sí,No"'],
    };

    clientsSheet.getCell(`Z${rowNumber}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"Sí,No"'],
    };

    clientsSheet.getCell(`AE${rowNumber}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"Contado,Crédito"'],
    };

    clientsSheet.getCell(`AG${rowNumber}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"CRC,USD,EUR,CLP,PYG,MXN,COP"'],
    };
  }

  const instructions = [
    ["Campo", "Descripción / valores permitidos"],
    ["Tipo de cliente", "Persona, Empresa u Otro"],
    ["Estado del cliente", "Activo, Prospecto, En espera o Inactivo"],
    ["WhatsApp habilitado", "Sí o No"],
    ["Contacto automático", "Sí o No"],
    ["Exento de impuestos", "Sí o No"],
    ["Condición de pago", "Contado o Crédito"],
    ["Moneda", "CRC, USD, EUR, CLP, PYG, MXN, COP, etc."],
    [
      "Empresa",
      "Si el tipo de cliente es Empresa, completar Razón social / Empresa.",
    ],
    [
      "Persona",
      "Si el tipo de cliente es Persona, completar Nombre y Primer apellido.",
    ],
    ["Teléfono principal", "Campo requerido."],
    [
      "Nota técnica",
      "CLARIUS traduce estos valores automáticamente al formato interno del sistema.",
    ],
  ];

  instructionsSheet.addRows(instructions);

  instructionsSheet.getRow(1).height = 24;
  instructionsSheet.getRow(1).eachCell((cell) => {
    cell.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F172A" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
  });

  instructionsSheet.columns = [{ width: 30 }, { width: 80 }];

  instructionsSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    row.eachCell((cell) => {
      cell.alignment = {
        vertical: "top",
        wrapText: true,
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  downloadWorkbookBuffer(
    buffer as ArrayBuffer,
    "clarius-clientes-plantilla.xlsx",
  );
}

function normalizeSheetRows(rows: Record<string, unknown>[]) {
  return rows.map((row, index) => {
    const normalizedRow = Object.entries(row).reduce<ClientImportRowInput>(
      (currentRow, [key, value]) => {
        const canonicalKey = getCanonicalKey(key);

        currentRow[canonicalKey] = normalizeImportValue(canonicalKey, value);

        return currentRow;
      },
      {},
    );

    normalizedRow.__rowNumber = String(index + 2);

    return normalizedRow;
  });
}

function validateClientImportRows(rows: ClientImportRowInput[]) {
  return rows.map<ImportPreviewRow>((row) => {
    const rowNumber = Number(row.__rowNumber || 0);
    const clientType = String(row.client_type || "PERSON").toUpperCase();
    const firstName = String(row.first_name || "");
    const lastName = String(row.last_name_1 || "");
    const companyName = String(row.company_name || "");
    const commercialName = String(row.commercial_name || "");
    const phone = String(row.phone_primary || "");
    const email = String(row.email || "");
    const status = String(row.client_status || "ACTIVE").toUpperCase();
    const paymentTerm = String(
      row.default_payment_term || "CASH",
    ).toUpperCase();
    const currency = String(row.preferred_currency || "CRC").toUpperCase();

    const errors: string[] = [];

    if (!["PERSON", "COMPANY", "OTHER"].includes(clientType)) {
      errors.push("Tipo de cliente no es válido");
    }

    if (!phone) {
      errors.push("Teléfono principal es requerido");
    }

    if (clientType === "COMPANY" && !companyName) {
      errors.push("Razón social / Empresa es requerida para empresas");
    }

    if (clientType !== "COMPANY" && (!firstName || !lastName)) {
      errors.push("Nombre y Primer apellido son requeridos para personas");
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Correo electrónico no tiene formato válido");
    }

    if (!["ACTIVE", "PROSPECT", "ON_HOLD", "INACTIVE"].includes(status)) {
      errors.push("Estado del cliente no es válido");
    }

    if (!["CASH", "CREDIT"].includes(paymentTerm)) {
      errors.push("Condición de pago no es válida");
    }

    if (!VALID_CURRENCIES.includes(currency)) {
      errors.push("Moneda no es válida");
    }

    return {
      rowNumber,
      clientName:
        commercialName ||
        companyName ||
        `${firstName} ${lastName}`.trim() ||
        "-",
      phone,
      email,
      status: errors.length > 0 ? "Error" : "Valid",
      message: errors.length > 0 ? errors.join("; ") : "Listo para importar",
      rawData: row,
    };
  });
}

export async function previewClientImportFile(file: File) {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const worksheetRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    worksheet,
    {
      defval: "",
    },
  );

  return validateClientImportRows(normalizeSheetRows(worksheetRows));
}
