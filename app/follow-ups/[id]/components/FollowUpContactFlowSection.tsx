"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import ContactFlowConversation from "./contact-flow/ContactFlowConversation";
import ContactFlowEmptyState from "./contact-flow/ContactFlowEmptyState";
import {
  calculateEstimatedTriggerDate,
  formatDate,
  formatDateTime,
  getMessageTypeLabel,
  getOperationalRisk,
  getStatusClasses,
  getStatusLabel,
} from "./contact-flow/contactFlowFormatters";
import {
  getAutomationSummary,
  getManualFlowAvailability,
} from "./contact-flow/contactFlowRules";
import type {
  ApiResponse,
  AutomationSettings,
  ContactFlowItem,
  ContactFlowMessage,
  CreateContactFlowApiResponse,
  FollowUpApiResponse,
  FollowUpAutomationContext,
  MessagesApiResponse,
  SendMessageApiResponse,
  SettingsApiResponse,
} from "./contact-flow/contactFlowTypes";

type Props = {
  followUpId: string;
};

type ContactFlowDateReviewAction = "approve" | "change" | "reject";

type ContactFlowDateReviewSuggestion = {
  operational_zone_visit_date_id: string;
  operational_zone_id: string;
  visit_date: string;
  can_offer_day: boolean;
  reason: string;
};

type ContactFlowDateReviewData = {
  contact_flow_id: string;
  follow_up_id: string;
  status: string;
  selected_date: string | null;
  scheduled_date: string | null;
  requires_manual_action: boolean;
  manual_reason: string | null;
  operational_zone_id: string | null;
  selected_date_availability: {
    checked: boolean;
    can_offer_day: boolean;
    reason: string;
  } | null;
  available_dates: ContactFlowDateReviewSuggestion[];
};

type ContactFlowDateReviewApiResponse = {
  success: boolean;
  data?: ContactFlowDateReviewData;
  message?: string;
  warning?: string;
};

type ContactFlowDateReviewActionResponse = {
  success: boolean;
  data?: {
    contact_flow_id: string;
    follow_up_id: string;
    status: string;
    selected_date: string | null;
    scheduled_date: string | null;
    requires_manual_action: boolean;
    whatsapp_message_sent: boolean;
  };
  message?: string;
  warning?: string;
};

async function readJsonResponse<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export default function FollowUpContactFlowSection({ followUpId }: Props) {
  const [flow, setFlow] = useState<ContactFlowItem | null>(null);
  const [messages, setMessages] = useState<ContactFlowMessage[]>([]);
  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [followUpContext, setFollowUpContext] =
    useState<FollowUpAutomationContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState("");
  const [messagesError, setMessagesError] = useState("");
  const [actionError, setActionError] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingMedia, setSendingMedia] = useState(false);
  const [creatingFlow, setCreatingFlow] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dateReview, setDateReview] =
    useState<ContactFlowDateReviewData | null>(null);
  const [dateReviewLoading, setDateReviewLoading] = useState(false);
  const [dateReviewSubmitting, setDateReviewSubmitting] =
    useState<ContactFlowDateReviewAction | null>(null);
  const [dateReviewError, setDateReviewError] = useState("");
  const [dateReviewMessage, setDateReviewMessage] = useState("");
  const [replacementDate, setReplacementDate] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  async function loadAutomationSettings() {
    try {
      const response = await fetch("/api/settings", {
        cache: "no-store",
      });

      const result = await readJsonResponse<SettingsApiResponse>(response);

      if (!response.ok || !result.success || !result.data) {
        setSettings(null);
        return;
      }

      setSettings(result.data);
    } catch {
      setSettings(null);
    }
  }

  async function loadFollowUpContext() {
    try {
      const response = await fetch(`/api/follow-ups/${followUpId}`, {
        cache: "no-store",
      });

      const result = await readJsonResponse<FollowUpApiResponse>(response);

      if (!response.ok || !result.success || !result.data) {
        setFollowUpContext(null);
        return;
      }

      setFollowUpContext(result.data);
    } catch {
      setFollowUpContext(null);
    }
  }

  async function loadMessages(contactFlowId: string) {
    try {
      setMessagesLoading(true);
      setMessagesError("");

      const response = await fetch(
        `/api/contact-flows/${contactFlowId}/messages`,
        { cache: "no-store" },
      );

      const result = await readJsonResponse<MessagesApiResponse>(response);

      if (!response.ok || !result.success) {
        throw new Error("No se pudo cargar la conversación.");
      }

      setMessages(result.data ?? []);
    } catch {
      setMessagesError("No se pudo cargar la conversación.");
    } finally {
      setMessagesLoading(false);
    }
  }

  async function loadDateReview(contactFlowId: string, showLoader = true) {
    try {
      if (showLoader) setDateReviewLoading(true);

      setDateReviewError("");

      const response = await fetch(
        `/api/contact-flows/${contactFlowId}/date-review`,
        {
          cache: "no-store",
        },
      );

      const result =
        await readJsonResponse<ContactFlowDateReviewApiResponse>(response);

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.message || "No se pudo cargar la revisión de fecha.",
        );
      }

      setDateReview(result.data);

      const firstAlternativeDate =
        result.data.available_dates.find(
          (item) => item.visit_date !== result.data?.selected_date,
        )?.visit_date ??
        result.data.available_dates[0]?.visit_date ??
        "";

      setReplacementDate(firstAlternativeDate);
    } catch (err) {
      setDateReview(null);
      setReplacementDate("");
      setDateReviewError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la revisión de fecha.",
      );
    } finally {
      setDateReviewLoading(false);
    }
  }

  async function loadContactFlow(showLoader = true) {
    try {
      if (showLoader) setLoading(true);

      setError("");
      setActionError("");

      await Promise.all([loadAutomationSettings(), loadFollowUpContext()]);

      const response = await fetch(
        `/api/contact-flows?follow_up_id=${followUpId}`,
        { cache: "no-store" },
      );

      const result = await readJsonResponse<ApiResponse>(response);

      if (!response.ok || !result.success) {
        throw new Error("No se pudo cargar la gestión de contacto.");
      }

      const data = Array.isArray(result.data)
        ? (result.data[0] ?? null)
        : result.data;

      setFlow(data);

      if (data?.contact_flow_id) {
        const tasks: Promise<void>[] = [loadMessages(data.contact_flow_id)];

        if (data.status === "MANUAL_REQUIRED" && data.selected_date) {
          tasks.push(loadDateReview(data.contact_flow_id, false));
        } else {
          setDateReview(null);
          setDateReviewError("");
          setReplacementDate("");
        }

        await Promise.all(tasks);
      } else {
        setMessages([]);
        setDateReview(null);
        setDateReviewError("");
        setReplacementDate("");
      }
    } catch {
      setError("No se pudo cargar la gestión de contacto.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateManualFlow() {
    try {
      setCreatingFlow(true);
      setActionError("");

      const response = await fetch("/api/contact-flows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          follow_up_id: followUpId,
        }),
      });

      const result =
        await readJsonResponse<CreateContactFlowApiResponse>(response);

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.message || "No se pudo iniciar la gestión de contacto.",
        );
      }

      setFlow(result.data);
      await loadContactFlow(false);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al iniciar la gestión de contacto.",
      );
    } finally {
      setCreatingFlow(false);
    }
  }

  useEffect(() => {
    if (followUpId) void loadContactFlow();
  }, [followUpId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, messagesLoading]);

  async function handleSendMessage(customMessage?: string) {
    if (!flow?.contact_flow_id) return;

    const trimmedMessage = (customMessage ?? inputMessage).trim();
    if (!trimmedMessage) return;

    try {
      setSending(true);
      setMessagesError("");

      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactFlowId: flow.contact_flow_id,
          message: trimmedMessage,
        }),
      });

      const result = await readJsonResponse<SendMessageApiResponse>(response);

      if (!response.ok || !result.success) {
        throw new Error(
          result.details || result.error || "No se pudo enviar el mensaje.",
        );
      }

      setInputMessage("");
      await loadContactFlow(false);
    } catch (err) {
      setMessagesError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al enviar el mensaje.",
      );
    } finally {
      setSending(false);
    }
  }

  async function handleSendMedia() {
    if (!flow?.contact_flow_id || !selectedFile) return;

    try {
      setSendingMedia(true);
      setMessagesError("");

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("entity_type", "contact_flow");
      formData.append("entity_id", flow.contact_flow_id);

      const uploadResponse = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });

      const uploadResult = await readJsonResponse<{
        success: boolean;
        message?: string;
        data?: {
          file_url?: string;
        };
      }>(uploadResponse);

      if (!uploadResponse.ok || !uploadResult.success) {
        throw new Error(uploadResult.message || "No se pudo subir el archivo.");
      }

      const uploadedFile = uploadResult.data;

      if (!uploadedFile?.file_url) {
        throw new Error("No se pudo obtener la URL del archivo.");
      }

      const isImage = selectedFile.type.startsWith("image/");

      const mediaResponse = await fetch("/api/whatsapp/send-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactFlowId: flow.contact_flow_id,
          mediaUrl: uploadedFile.file_url,
          mediaType: isImage ? "image" : "document",
          filename: selectedFile.name,
          caption: inputMessage.trim() || undefined,
        }),
      });

      const mediaResult = await readJsonResponse<{
        success: boolean;
        error?: string;
      }>(mediaResponse);

      if (!mediaResponse.ok || !mediaResult.success) {
        throw new Error(mediaResult.error || "No se pudo enviar el archivo.");
      }

      setSelectedFile(null);
      setInputMessage("");
      await loadContactFlow(false);
    } catch (err) {
      setMessagesError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error enviando el archivo.",
      );
    } finally {
      setSendingMedia(false);
    }
  }

  async function handleDateReviewAction(action: ContactFlowDateReviewAction) {
    if (!flow?.contact_flow_id) return;

    if (action === "change") {
      if (!replacementDate) {
        setDateReviewError("Seleccione una nueva fecha disponible.");
        return;
      }

      if (replacementDate === dateReview?.selected_date) {
        setDateReviewError(
          "Seleccione una fecha diferente a la preferencia actual.",
        );
        return;
      }
    }

    if (
      action === "approve" &&
      !window.confirm(
        "¿Confirma esta fecha como la fecha definitiva del mantenimiento?",
      )
    ) {
      return;
    }

    if (
      action === "reject" &&
      !window.confirm(
        "¿Desea rechazar la fecha seleccionada y mantener el mantenimiento pendiente de coordinación?",
      )
    ) {
      return;
    }

    try {
      setDateReviewSubmitting(action);
      setDateReviewError("");
      setDateReviewMessage("");

      const response = await fetch(
        `/api/contact-flows/${flow.contact_flow_id}/date-review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            ...(action === "change"
              ? {
                  selected_date: replacementDate,
                }
              : {}),
            ...(action === "reject" && rejectionReason.trim()
              ? {
                  reason: rejectionReason.trim(),
                }
              : {}),
          }),
        },
      );

      const result =
        await readJsonResponse<ContactFlowDateReviewActionResponse>(response);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudo procesar la revisión de fecha.",
        );
      }

      setDateReviewMessage(
        [result.message, result.warning].filter(Boolean).join(" "),
      );
      setRejectionReason("");

      await loadContactFlow(false);
    } catch (err) {
      const reviewErrorMessage =
        err instanceof Error
          ? err.message
          : "No se pudo procesar la revisión de fecha.";

      if (flow.contact_flow_id) {
        await loadDateReview(flow.contact_flow_id, false);
      }

      setDateReviewError(reviewErrorMessage);
    } finally {
      setDateReviewSubmitting(null);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey && !selectedFile) {
      event.preventDefault();
      void handleSendMessage();
    }
  }

  const automationSummary = getAutomationSummary({
    flow,
    settings,
    followUpContext,
  });

  const manualFlowAvailability = getManualFlowAvailability({
    settings,
    followUpContext,
  });

  const estimatedTriggerDate = calculateEstimatedTriggerDate(
    followUpContext?.target_date ?? null,
    settings?.maintenance_contact_days_before,
  );

  if (loading) {
    return (
      <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
        Cargando gestión de contacto...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-5 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (!flow) {
    return (
      <ContactFlowEmptyState
        settings={settings}
        followUpContext={followUpContext}
        automationSummary={automationSummary}
        manualFlowAvailability={manualFlowAvailability}
        estimatedTriggerDate={estimatedTriggerDate}
        actionError={actionError}
        creatingFlow={creatingFlow}
        onCreateManualFlow={handleCreateManualFlow}
        onRefresh={() => loadContactFlow(false)}
      />
    );
  }

  const risk = getOperationalRisk(flow);

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-950">
            Gestión de contacto con cliente
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Centraliza mensajes, respuestas y coordinación del mantenimiento.
          </p>
        </div>

        <span className="inline-flex h-8 w-fit items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-600">
          WhatsApp / contacto
        </span>
      </header>

      <div
        className={`rounded-md border px-3 py-3 ${automationSummary.cardClasses}`}
      >
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-base shadow-sm">
            {automationSummary.icon}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={`text-sm font-semibold ${automationSummary.textClasses}`}
              >
                {automationSummary.title}
              </p>

              <span
                className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${automationSummary.badgeClasses}`}
              >
                {automationSummary.badge}
              </span>
            </div>

            <p
              className={`mt-1.5 text-xs leading-5 ${automationSummary.textClasses}`}
            >
              {automationSummary.description}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Estado actual
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${getStatusClasses(
                flow.status,
              )}`}
            >
              {getStatusLabel(flow.status)}
            </span>

            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${risk.classes}`}
            >
              {risk.label}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadContactFlow(false)}
            disabled={
              messagesLoading ||
              sending ||
              sendingMedia ||
              dateReviewLoading ||
              Boolean(dateReviewSubmitting)
            }
            className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Refrescar
          </button>

          <button
            type="button"
            onClick={() => {
              window.location.href = "/contact-attempts";
            }}
            className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Ver intentos de contacto
          </button>
        </div>
      </div>

      <div className="grid gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 md:grid-cols-3">
        <InfoCell
          label="Fecha de activación"
          value={formatDate(flow.trigger_date)}
        />

        <InfoCell
          label="Fecha seleccionada"
          value={formatDate(flow.selected_date)}
        />

        <InfoCell
          label="Última interacción"
          value={formatDateTime(flow.last_message_at)}
        />
      </div>

      <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Último mensaje
          </p>

          <span className="text-xs font-medium text-slate-500">
            {getMessageTypeLabel(flow.last_message?.direction)}
          </span>
        </div>

        <p className="mt-2 whitespace-pre-line text-sm leading-5 text-slate-700">
          {flow.last_message?.message_text ||
            "Aún no hay mensajes registrados para este flujo."}
        </p>
      </div>

      {flow.manual_reason ? (
        <div className="rounded-md border border-rose-100 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-700">
          {flow.manual_reason}
        </div>
      ) : null}

      {dateReviewMessage ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs leading-5 text-emerald-700">
          {dateReviewMessage}
        </div>
      ) : null}

      {flow.status === "MANUAL_REQUIRED" && flow.selected_date ? (
        <section className="rounded-md border border-amber-200 bg-amber-50/50 px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                Revisión humana de fecha
              </p>

              <h3 className="mt-1 text-sm font-semibold text-slate-950">
                Preferencia pendiente de confirmación
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                La elección del cliente todavía no modifica la fecha programada.
                Confirme, cambie o rechace la selección después de revisar la
                disponibilidad actual.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                flow.contact_flow_id
                  ? void loadDateReview(flow.contact_flow_id)
                  : undefined
              }
              disabled={dateReviewLoading || Boolean(dateReviewSubmitting)}
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {dateReviewLoading ? "Validando..." : "Revalidar"}
            </button>
          </div>

          {dateReviewError ? (
            <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">
              {dateReviewError}
            </div>
          ) : null}

          {dateReviewLoading && !dateReview ? (
            <div className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-3 text-xs text-slate-500">
              Consultando disponibilidad actual...
            </div>
          ) : null}

          {dateReview ? (
            <div className="mt-4 space-y-4">
              <div className="grid gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 md:grid-cols-3">
                <InfoCell
                  label="Preferencia del cliente"
                  value={formatDate(dateReview.selected_date)}
                />

                <InfoCell
                  label="Fecha programada actual"
                  value={formatDate(dateReview.scheduled_date)}
                />

                <InfoCell
                  label="Disponibilidad actual"
                  value={
                    dateReview.selected_date_availability?.checked
                      ? dateReview.selected_date_availability.can_offer_day
                        ? "Disponible"
                        : "No disponible"
                      : "No validada"
                  }
                />
              </div>

              {dateReview.selected_date_availability ? (
                <div
                  className={`rounded-md border px-3 py-2.5 text-xs leading-5 ${
                    dateReview.selected_date_availability.checked &&
                    dateReview.selected_date_availability.can_offer_day
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  {dateReview.selected_date_availability.reason}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleDateReviewAction("approve")}
                  disabled={
                    Boolean(dateReviewSubmitting) ||
                    dateReviewLoading ||
                    !dateReview.selected_date_availability?.checked ||
                    !dateReview.selected_date_availability.can_offer_day
                  }
                  className="inline-flex h-9 items-center justify-center rounded-md bg-slate-950 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {dateReviewSubmitting === "approve"
                    ? "Confirmando..."
                    : "Confirmar fecha"}
                </button>
              </div>

              <div className="grid gap-4 border-t border-amber-200 pt-4 lg:grid-cols-2">
                <div>
                  <label
                    htmlFor="contact-flow-replacement-date"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Elegir otra fecha disponible
                  </label>

                  <select
                    id="contact-flow-replacement-date"
                    value={replacementDate}
                    onChange={(event) => {
                      setReplacementDate(event.target.value);
                      setDateReviewError("");
                    }}
                    disabled={
                      dateReview.available_dates.length === 0 ||
                      Boolean(dateReviewSubmitting)
                    }
                    className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    {dateReview.available_dates.length === 0 ? (
                      <option value="">No hay fechas disponibles</option>
                    ) : (
                      dateReview.available_dates.map((item) => (
                        <option
                          key={item.operational_zone_visit_date_id}
                          value={item.visit_date}
                        >
                          {formatDate(item.visit_date)}
                          {item.visit_date === dateReview.selected_date
                            ? " — selección actual"
                            : ""}
                        </option>
                      ))
                    )}
                  </select>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Guardar otra preferencia no programa el mantenimiento. La
                    nueva fecha continuará pendiente de confirmación.
                  </p>

                  <button
                    type="button"
                    onClick={() => void handleDateReviewAction("change")}
                    disabled={
                      Boolean(dateReviewSubmitting) ||
                      !replacementDate ||
                      replacementDate === dateReview.selected_date
                    }
                    className="mt-2 inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {dateReviewSubmitting === "change"
                      ? "Guardando..."
                      : "Guardar nueva preferencia"}
                  </button>
                </div>

                <div>
                  <label
                    htmlFor="contact-flow-rejection-reason"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Rechazar la fecha seleccionada
                  </label>

                  <textarea
                    id="contact-flow-rejection-reason"
                    value={rejectionReason}
                    onChange={(event) => setRejectionReason(event.target.value)}
                    placeholder="Motivo opcional para el seguimiento interno"
                    disabled={Boolean(dateReviewSubmitting)}
                    className="min-h-[88px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />

                  <button
                    type="button"
                    onClick={() => void handleDateReviewAction("reject")}
                    disabled={Boolean(dateReviewSubmitting)}
                    className="mt-2 inline-flex h-9 items-center justify-center rounded-md border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {dateReviewSubmitting === "reject"
                      ? "Rechazando..."
                      : "Rechazar selección"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <ContactFlowConversation
        messages={messages}
        messagesLoading={messagesLoading}
        messagesError={messagesError}
        sending={sending}
        sendingMedia={sendingMedia}
        selectedFile={selectedFile}
        inputMessage={inputMessage}
        messagesEndRef={messagesEndRef}
        onSendMessage={handleSendMessage}
        onSendMedia={handleSendMedia}
        onSelectedFileChange={setSelectedFile}
        onInputMessageChange={setInputMessage}
        onKeyDown={handleKeyDown}
      />
    </section>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-white px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium leading-5 text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
}
