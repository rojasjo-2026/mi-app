type ClientType = "PERSON" | "COMPANY" | "OTHER";
type ClientComplianceProfile = "GLOBAL" | "COSTA_RICA";

export function getDefaultIdentificationType(
  clientType: ClientType,
  complianceProfile: ClientComplianceProfile,
) {
  if (complianceProfile === "GLOBAL") {
    return clientType === "COMPANY" ? "BUSINESS_REGISTRATION" : "NATIONAL_ID";
  }

  if (clientType === "COMPANY") {
    return "CEDULA_JURIDICA";
  }

  if (clientType === "PERSON") {
    return "CEDULA_FISICA";
  }

  return "OTHER";
}

export function buildFullName(
  firstName: string,
  lastName1: string,
  lastName2: string,
) {
  return [firstName, lastName1, lastName2].filter(Boolean).join(" ").trim();
}

export function normalizeIdentificationValue(value: string) {
  return value.trim().replace(/[\s-]/g, "");
}

export function getIdentificationHelpText(identificationType: string) {
  switch (identificationType) {
    case "CEDULA_FISICA":
      return "Formato esperado: 9 dígitos sin guiones. Ejemplo: 101110111.";

    case "CEDULA_JURIDICA":
      return "Formato esperado: 10 dígitos sin guiones. Ejemplo: 3101123456.";

    case "DIMEX":
      return "Formato esperado: 11 o 12 dígitos, sin guiones, sin espacios y no debe iniciar con 0. Ejemplo: 12345678901.";

    case "NITE":
      return "Formato esperado: 10 dígitos sin guiones. Ejemplo: 1234567890.";

    case "EXTRANJERO_NO_DOMICILIADO":
      return "Ingrese el número de identificación disponible, sin guiones ni espacios cuando sea posible.";

    case "NO_CONTRIBUYENTE":
      return "Ingrese una identificación de referencia para registrar al cliente.";

    case "NATIONAL_ID":
      return "Ingrese el documento nacional del cliente.";

    case "TAX_ID":
      return "Ingrese el documento fiscal o tributario del cliente.";

    case "PASSPORT":
      return "Ingrese el número de pasaporte.";

    case "BUSINESS_REGISTRATION":
      return "Ingrese el número de registro empresarial.";

    default:
      return "Ingrese la identificación del cliente.";
  }
}

export function validateIdentificationNumber(
  identificationType: string,
  identificationNumber: string,
) {
  const normalizedValue = normalizeIdentificationValue(identificationNumber);

  if (!normalizedValue) {
    return "La identificación es obligatoria. Seleccione el tipo de identificación e ingrese el número correspondiente.";
  }

  switch (identificationType) {
    case "CEDULA_FISICA":
      if (!/^\d{9}$/.test(normalizedValue)) {
        return "La cédula física debe tener 9 dígitos sin guiones. Ejemplo: 101110111.";
      }
      return null;

    case "CEDULA_JURIDICA":
      if (!/^\d{10}$/.test(normalizedValue)) {
        return "La cédula jurídica debe tener 10 dígitos sin guiones. Ejemplo: 3101123456.";
      }
      return null;

    case "DIMEX":
      if (!/^[1-9]\d{10,11}$/.test(normalizedValue)) {
        return "El DIMEX debe tener 11 o 12 dígitos, sin guiones, sin espacios y no debe iniciar con 0. Ejemplo: 12345678901.";
      }
      return null;

    case "NITE":
      if (!/^\d{10}$/.test(normalizedValue)) {
        return "El NITE debe tener 10 dígitos sin guiones. Ejemplo: 1234567890.";
      }
      return null;

    case "EXTRANJERO_NO_DOMICILIADO":
    case "NO_CONTRIBUYENTE":
    case "OTHER":
      if (normalizedValue.length > 20) {
        return "La identificación no debe superar los 20 caracteres.";
      }
      return null;

    default:
      return null;
  }
}

export function getReadableFieldName(field?: string) {
  switch (field) {
    case "identification_number":
      return "Identificación";

    case "identification_type":
      return "Tipo de identificación";

    case "first_name":
      return "Nombre";

    case "last_name_1":
      return "Primer apellido";

    case "phone_primary":
      return "Teléfono principal";

    case "company_name":
      return "Nombre de empresa";

    case "display_name":
      return "Nombre del cliente";

    case "default_credit_days":
      return "Días de crédito";

    case "client_type":
      return "Tipo de cliente";

    case "compliance_profile":
      return "Perfil de validación";

    case "client_status":
      return "Estado del cliente";

    default:
      return "Campo";
  }
}

export function getReadableValidationError(error: string) {
  switch (error) {
    case "cedula_fisica_must_have_9_digits":
      return "La cédula física debe tener 9 dígitos sin guiones. Ejemplo: 101110111.";

    case "cedula_juridica_must_have_10_digits":
      return "La cédula jurídica debe tener 10 dígitos sin guiones. Ejemplo: 3101123456.";

    case "dimex_must_have_11_or_12_digits_without_leading_zero":
      return "El DIMEX debe tener 11 o 12 dígitos, sin guiones, sin espacios y no debe iniciar con 0. Ejemplo: 12345678901.";

    case "nite_must_have_10_digits":
      return "El NITE debe tener 10 dígitos sin guiones. Ejemplo: 1234567890.";

    case "identification_number_max_20_characters":
      return "La identificación no debe superar los 20 caracteres.";

    case "invalid_costa_rica_identification_type":
      return "El tipo de identificación seleccionado no es válido para Costa Rica.";

    case "required":
      return "Este campo es obligatorio.";

    case "invalid":
      return "El valor ingresado no es válido.";

    case "required_when_payment_term_is_credit":
      return "Este campo es obligatorio cuando el tipo de pago es crédito.";

    case "phone_must_have_between_8_and_20_digits":
      return "El teléfono debe tener entre 8 y 20 dígitos.";

    default:
      return error;
  }
}
