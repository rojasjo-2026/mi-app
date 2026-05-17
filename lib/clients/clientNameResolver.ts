import {
  normalizeClientType,
  toTrimmedString,
  type ClientType,
} from "@/lib/clients/clientNormalizers";

type ClientNameInput = {
  client_type?: ClientType | string | null;

  first_name?: string | null;
  last_name_1?: string | null;
  last_name_2?: string | null;

  display_name?: string | null;
  legal_name?: string | null;
  company_name?: string | null;
  commercial_name?: string | null;
  main_contact_name?: string | null;
};

type ResolvedClientNames = {
  clientType: ClientType;
  firstName: string;
  lastName1: string;
  lastName2: string | null;
  displayName: string;
  legalName: string;
  companyName: string | null;
  commercialName: string | null;
  mainContactName: string | null;
};

export function buildPersonDisplayName(params: {
  firstName: string | null;
  lastName1: string | null;
  lastName2: string | null;
}) {
  return [params.firstName, params.lastName1, params.lastName2]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function resolveClientNames(body: ClientNameInput): ResolvedClientNames {
  const clientType = normalizeClientType(body.client_type);

  const firstName = toTrimmedString(body.first_name);
  const lastName1 = toTrimmedString(body.last_name_1);
  const lastName2 = toTrimmedString(body.last_name_2);

  const companyName = toTrimmedString(body.company_name);
  const commercialName = toTrimmedString(body.commercial_name);
  const legalNameInput = toTrimmedString(body.legal_name);
  const displayNameInput = toTrimmedString(body.display_name);
  const mainContactName = toTrimmedString(body.main_contact_name);

  if (clientType === "COMPANY") {
    const resolvedCompanyName =
      companyName ?? legalNameInput ?? displayNameInput ?? "Empresa";

    return {
      clientType,
      firstName: resolvedCompanyName,
      lastName1: "Empresa",
      lastName2: null,
      displayName: displayNameInput ?? resolvedCompanyName,
      legalName: legalNameInput ?? resolvedCompanyName,
      companyName: resolvedCompanyName,
      commercialName,
      mainContactName,
    };
  }

  if (clientType === "OTHER") {
    const resolvedName =
      displayNameInput ?? legalNameInput ?? firstName ?? "Cliente";

    return {
      clientType,
      firstName: resolvedName,
      lastName1: "Otro",
      lastName2: null,
      displayName: resolvedName,
      legalName: legalNameInput ?? resolvedName,
      companyName,
      commercialName,
      mainContactName,
    };
  }

  const personDisplayName =
    displayNameInput ||
    buildPersonDisplayName({
      firstName,
      lastName1,
      lastName2,
    });

  return {
    clientType,
    firstName: firstName ?? "",
    lastName1: lastName1 ?? "",
    lastName2,
    displayName: personDisplayName,
    legalName: legalNameInput ?? personDisplayName,
    companyName,
    commercialName,
    mainContactName,
  };
}
