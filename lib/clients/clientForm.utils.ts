type ClientType = "PERSON" | "COMPANY" | "OTHER";
type ClientComplianceProfile = "GLOBAL" | "COSTA_RICA";

const MAX_IDENTIFICATION_LENGTH = 20;

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

function validateGenericIdentificationLength(normalizedValue: string) {
  if (normalizedValue.length > MAX_IDENTIFICATION_LENGTH) {
    return `La identificación no debe superar los ${MAX_IDENTIFICATION_LENGTH} caracteres.`;
  }

  return null;
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

    case "NATIONAL_ID":
    case "TAX_ID":
    case "PASSPORT":
    case "BUSINESS_REGISTRATION":
    case "EXTRANJERO_NO_DOMICILIADO":
    case "NO_CONTRIBUYENTE":
    case "OTHER":
      return validateGenericIdentificationLength(normalizedValue);

    default:
      return validateGenericIdentificationLength(normalizedValue);
  }
}

export function getReadableFieldName(field?: string) {
  switch (field) {
    case "client_type":
      return "Tipo de cliente";

    case "compliance_profile":
      return "Perfil de validación";

    case "country_code":
      return "País";

    case "identification_country":
      return "País de identificación";

    case "identification_number":
    case "tax_id":
      return "Identificación";

    case "identification_type":
      return "Tipo de identificación";

    case "first_name":
      return "Nombre";

    case "last_name_1":
      return "Primer apellido";

    case "last_name_2":
      return "Segundo apellido";

    case "phone_primary":
      return "Teléfono principal";

    case "phone_secondary":
      return "Teléfono secundario";

    case "email":
      return "Correo electrónico";

    case "company_name":
      return "Nombre de empresa";

    case "display_name":
      return "Nombre del cliente";

    case "legal_name":
      return "Nombre legal";

    case "address_line":
      return "Dirección";

    case "admin_level_1":
      return "Nivel administrativo 1";

    case "admin_level_2":
      return "Nivel administrativo 2";

    case "admin_level_3":
      return "Nivel administrativo 3";

    case "default_credit_days":
      return "Días de crédito";

    case "default_discount_rate":
      return "Descuento por defecto";

    case "credit_limit":
      return "Límite de crédito";

    case "preferred_currency":
      return "Moneda preferida";

    case "client_status":
      return "Estado del cliente";

    case "billing_name":
      return "Nombre de facturación";

    case "billing_email":
      return "Correo de facturación";

    case "billing_phone":
      return "Teléfono de facturación";

    case "billing_address":
      return "Dirección de facturación";

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
      return `La identificación no debe superar los ${MAX_IDENTIFICATION_LENGTH} caracteres.`;

    case "invalid_costa_rica_identification_type":
      return "El tipo de identificación seleccionado no es válido para el país seleccionado.";

    case "required":
      return "Este campo es obligatorio.";

    case "invalid":
      return "El valor ingresado no es válido.";

    case "required_when_payment_term_is_credit":
      return "Este campo es obligatorio cuando el tipo de pago es crédito.";

    case "phone_must_have_between_8_and_20_digits":
      return "El teléfono debe tener entre 8 y 20 dígitos.";

    case "email_must_be_valid":
      return "El correo electrónico no tiene un formato válido.";

    case "number_must_be_positive":
      return "El valor debe ser mayor o igual a cero.";

    default:
      return error;
  }
}
