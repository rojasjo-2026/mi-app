import type {
  AutomationSettings,
  ContactFlowItem,
  FollowUpAutomationContext,
} from "./contactFlowTypes";

export function getAutomationSummary(params: {
  flow: ContactFlowItem | null;
  settings: AutomationSettings | null;
  followUpContext: FollowUpAutomationContext | null;
}) {
  const { flow, settings, followUpContext } = params;

  if (flow) {
    return {
      title: "Gestión de contacto activa",
      description:
        "Este mantenimiento ya tiene una gestión de contacto asociada. El sistema puede usar este flujo para registrar mensajes, respuestas y seguimiento.",
      icon: "✅",
      badge: "Flujo activo",
      cardClasses: "border-emerald-200 bg-emerald-50",
      badgeClasses: "border-emerald-200 bg-white text-emerald-700",
      textClasses: "text-emerald-800",
    };
  }

  if (!settings) {
    return {
      title: "No se pudo validar la configuración",
      description:
        "No existe una gestión de contacto para este mantenimiento y no fue posible leer la configuración general en este momento.",
      icon: "⚠️",
      badge: "Sin validar",
      cardClasses: "border-amber-200 bg-amber-50",
      badgeClasses: "border-amber-200 bg-white text-amber-700",
      textClasses: "text-amber-800",
    };
  }

  if (!settings.whatsapp_enabled) {
    return {
      title: "WhatsApp desactivado",
      description:
        "No se puede iniciar una gestión de contacto porque WhatsApp está apagado en la configuración general.",
      icon: "⏸️",
      badge: "WhatsApp apagado",
      cardClasses: "border-slate-200 bg-slate-50",
      badgeClasses: "border-slate-200 bg-white text-slate-700",
      textClasses: "text-slate-700",
    };
  }

  if (followUpContext?.client?.whatsapp_opt_in === false) {
    return {
      title: "Cliente sin permiso de WhatsApp",
      description:
        "No se puede iniciar una gestión de contacto porque este cliente no tiene marcado el permiso para ser contactado por WhatsApp.",
      icon: "🚫",
      badge: "Cliente no autorizado",
      cardClasses: "border-rose-200 bg-rose-50",
      badgeClasses: "border-rose-200 bg-white text-rose-700",
      textClasses: "text-rose-800",
    };
  }

  if (!settings.auto_contact_enabled) {
    return {
      title: "Contacto automático desactivado",
      description:
        "No se preparó una gestión automática, pero puede iniciar una gestión manual para conversar con el cliente desde este mantenimiento.",
      icon: "💬",
      badge: "Manual disponible",
      cardClasses: "border-sky-200 bg-sky-50",
      badgeClasses: "border-sky-200 bg-white text-sky-700",
      textClasses: "text-sky-800",
    };
  }

  return {
    title: "Sin gestión de contacto registrada",
    description:
      "La configuración permite automatización, pero todavía no existe una gestión de contacto para este mantenimiento. Puede iniciarla manualmente desde aquí.",
    icon: "💬",
    badge: "Manual disponible",
    cardClasses: "border-sky-200 bg-sky-50",
    badgeClasses: "border-sky-200 bg-white text-sky-700",
    textClasses: "text-sky-800",
  };
}

export function getManualFlowAvailability(params: {
  settings: AutomationSettings | null;
  followUpContext: FollowUpAutomationContext | null;
}) {
  const { settings, followUpContext } = params;

  if (!settings) {
    return {
      canStart: false,
      reason: "No se pudo validar la configuración general.",
    };
  }

  if (!settings.whatsapp_enabled) {
    return {
      canStart: false,
      reason:
        "Active WhatsApp en la configuración general para iniciar el chat.",
    };
  }

  if (!followUpContext) {
    return {
      canStart: false,
      reason: "No se pudo validar la información del mantenimiento.",
    };
  }

  if (!followUpContext.client) {
    return {
      canStart: false,
      reason: "No se pudo validar la información del cliente.",
    };
  }

  if (!followUpContext.client.whatsapp_opt_in) {
    return {
      canStart: false,
      reason: "El cliente no permite contacto por WhatsApp.",
    };
  }

  if (!followUpContext.client.phone_primary) {
    return {
      canStart: false,
      reason: "El cliente no tiene teléfono principal.",
    };
  }

  return {
    canStart: true,
    reason: "Puede iniciar una gestión manual de contacto.",
  };
}
