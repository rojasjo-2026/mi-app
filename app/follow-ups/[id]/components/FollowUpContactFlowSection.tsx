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
        await loadMessages(data.contact_flow_id);
      } else {
        setMessages([]);
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
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
        Cargando gestión de contacto...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
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
    <section className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Contacto y coordinación
            </p>

            <h2 className="text-lg font-semibold text-slate-900">
              Gestión de contacto con cliente
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Este flujo centraliza los mensajes, respuestas y coordinación del
              mantenimiento para mantener la relación entre cliente, instalación
              y seguimiento operativo.
            </p>
          </div>

          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
            WhatsApp / contacto
          </span>
        </div>
      </div>

      <div
        className={`rounded-2xl border p-5 ${automationSummary.cardClasses}`}
      >
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
            {automationSummary.icon}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={`text-sm font-bold ${automationSummary.textClasses}`}
              >
                {automationSummary.title}
              </p>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${automationSummary.badgeClasses}`}
              >
                {automationSummary.badge}
              </span>
            </div>

            <p
              className={`mt-2 max-w-3xl text-sm leading-6 ${automationSummary.textClasses}`}
            >
              {automationSummary.description}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Estado actual
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                flow.status,
              )}`}
            >
              {getStatusLabel(flow.status)}
            </span>

            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${risk.classes}`}
            >
              {risk.label}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadContactFlow(false)}
            disabled={messagesLoading || sending || sendingMedia}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Refrescar
          </button>

          <button
            type="button"
            onClick={() => {
              window.location.href = "/contact-attempts";
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Ver intentos de contacto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Fecha de activación
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {formatDate(flow.trigger_date)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Fecha seleccionada
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {formatDate(flow.selected_date)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Última interacción
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {formatDateTime(flow.last_message_at)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Último mensaje
          </p>

          <span className="text-xs font-semibold text-slate-400">
            {getMessageTypeLabel(flow.last_message?.direction)}
          </span>
        </div>

        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
          {flow.last_message?.message_text ||
            "Aún no hay mensajes registrados para este flujo."}
        </p>
      </div>

      {flow.manual_reason && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm leading-6 text-rose-700">
          {flow.manual_reason}
        </div>
      )}

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
