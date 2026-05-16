"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ContactFlowItem = {
  contact_flow_id: string;
  status:
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
  trigger_date: string;
  selected_date: string | null;
  first_message_sent_at: string | null;
  last_message_at: string | null;
  requires_manual_action: boolean;
  manual_reason: string | null;
  unread_count?: number;
  has_unread_messages?: boolean;
  client: {
    client_id: string;
    first_name: string;
    last_name_1: string;
    last_name_2: string | null;
    phone_primary: string;
  };
  installation: {
    installation_id: string;
    description: string | null;
  } | null;
  follow_up: {
    follow_up_id: string;
    target_date: string;
    scheduled_date: string | null;
    reason: string | null;
    priority: number;
    follow_up_status: {
      follow_up_status_id: number;
      code: string;
      name: string;
      is_active: boolean;
    };
  };
  last_message: {
    message_id: string;
    direction: "OUTBOUND" | "INBOUND";
    message_text: string;
    message_type?: string | null;
    delivery_status?: string | null;
    metadata?: ContactFlowMessageMetadata | null;
    created_at: string;
    sent_at: string | null;
    received_at: string | null;
  } | null;
};

type ContactFlowMessageMetadata = {
  mediaUrl?: string;
  mediaType?: string;
  filename?: string | null;
  caption?: string | null;
  [key: string]: unknown;
};

type ContactFlowMessage = {
  message_id: string;
  contact_flow_id: string;
  direction: "OUTBOUND" | "INBOUND";
  message_text: string;
  message_type?: string | null;
  delivery_status?: string | null;
  metadata?: ContactFlowMessageMetadata | null;
  sent_at: string | null;
  received_at: string | null;
  created_at: string;
};

type ApiResponse = {
  success: boolean;
  data: ContactFlowItem[];
};

type MessagesApiResponse = {
  success: boolean;
  data: ContactFlowMessage[];
};

type SendMessageApiResponse = {
  success: boolean;
  error?: string;
  details?: string;
  isMock?: boolean;
  data?: {
    messageId: string;
    waMessageId: string;
    contactFlowId: string;
    phoneNumber: string;
    sentAt: string | null;
  };
};

type FilterType = "all" | "unread" | "waiting" | "confirmed" | "manual";
type ViewMode = "list" | "grid";

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("es-CR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("es-CR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getClientFullName(client: ContactFlowItem["client"]) {
  return [client.first_name, client.last_name_1, client.last_name_2]
    .filter(Boolean)
    .join(" ");
}

function getStatusLabel(status: ContactFlowItem["status"]) {
  switch (status) {
    case "WAITING_RESPONSE":
      return "Esperando respuesta";
    case "OPTIONS_SENT":
      return "Opciones enviadas";
    case "CONFIRMED":
      return "Confirmado";
    case "MANUAL_REQUIRED":
      return "Requiere gestión";
    case "REJECTED":
      return "Rechazado";
    case "NO_RESPONSE":
      return "Sin respuesta";
    case "MESSAGE_SENT":
      return "Mensaje enviado";
    case "DATE_SELECTED":
      return "Fecha seleccionada";
    case "CLOSED":
      return "Cerrado";
    default:
      return "Pendiente";
  }
}

function getStatusClasses(status: ContactFlowItem["status"]) {
  switch (status) {
    case "CONFIRMED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "WAITING_RESPONSE":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "OPTIONS_SENT":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "MANUAL_REQUIRED":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "REJECTED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "NO_RESPONSE":
      return "border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getOperationalRisk(flow: ContactFlowItem) {
  if (flow.requires_manual_action || flow.status === "MANUAL_REQUIRED") {
    return {
      label: "Atención requerida",
      classes: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  if (flow.status === "WAITING_RESPONSE" || flow.status === "OPTIONS_SENT") {
    return {
      label: "Seguimiento pendiente",
      classes: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (flow.status === "CONFIRMED") {
    return {
      label: "Confirmado",
      classes: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  return {
    label: "En proceso",
    classes: "border-slate-200 bg-slate-50 text-slate-700",
  };
}

function getMessageTypeLabel(direction?: "OUTBOUND" | "INBOUND") {
  if (direction === "OUTBOUND") return "🤖 Enviado";
  if (direction === "INBOUND") return "👤 Cliente";
  return "Sin actividad";
}

function getLastMessagePreview(message: ContactFlowItem["last_message"]) {
  if (!message) return "Aún no hay mensajes registrados.";

  if (message.message_type === "image") return "📷 Imagen";
  if (message.message_type === "document") return "📄 Documento";

  return message.message_text || "Mensaje sin texto.";
}

function hasUnreadMessages(flow: ContactFlowItem) {
  return Boolean(flow.has_unread_messages && flow.unread_count);
}

function getMessageMediaUrl(message: ContactFlowMessage) {
  if (!message.metadata) return null;

  const mediaUrl = message.metadata.mediaUrl;

  return typeof mediaUrl === "string" && mediaUrl.trim() ? mediaUrl : null;
}

function getMessageFileName(message: ContactFlowMessage) {
  if (!message.metadata) return "Documento";

  const filename = message.metadata.filename;

  return typeof filename === "string" && filename.trim()
    ? filename
    : "Documento";
}

function getDeliveryLabel(status?: string | null) {
  if (status === "read") return "✓✓";
  if (status === "delivered") return "✓✓";
  if (status === "failed") return "!";
  if (status === "sent" || status === "mock-sent") return "✓";

  return "";
}

function renderMessageContent(
  message: ContactFlowMessage,
  onOpenImage?: (imageUrl: string) => void,
) {
  const mediaUrl = getMessageMediaUrl(message);
  const isImage = message.message_type === "image";
  const isDocument = message.message_type === "document";

  if (isImage && mediaUrl) {
    return (
      <>
        <button
          type="button"
          onClick={() => onOpenImage?.(mediaUrl)}
          className="block w-full overflow-hidden rounded-xl"
        >
          <img
            src={mediaUrl}
            alt="Imagen enviada"
            className="max-h-[260px] w-full rounded-xl object-cover transition hover:scale-[1.01]"
          />
        </button>

        {message.message_text && (
          <p className="mt-2 whitespace-pre-line text-sm leading-6">
            {message.message_text}
          </p>
        )}
      </>
    );
  }

  if (isDocument && mediaUrl) {
    return (
      <>
        <a
          href={mediaUrl}
          target="_blank"
          rel="noreferrer"
          className="flex min-w-[240px] items-center gap-3 rounded-xl border border-slate-200 bg-white/80 p-3 transition hover:bg-white hover:shadow-sm"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-xl">
            📄
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">
              {getMessageFileName(message)}
            </p>

            <p className="mt-0.5 text-xs text-slate-500">Documento adjunto</p>
          </div>

          <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
            Abrir
          </span>
        </a>

        {message.message_text && (
          <p className="mt-2 whitespace-pre-line text-sm leading-6">
            {message.message_text}
          </p>
        )}
      </>
    );
  }

  return (
    <p className="whitespace-pre-line text-sm leading-6">
      {message.message_text}
    </p>
  );
}

type ContactFlowChatProps = {
  contactFlowId: string;
  clientName: string;
  installationName: string;
  onClose: () => void;
  onMessageSent: () => Promise<void> | void;
};

function ContactFlowChat({
  contactFlowId,
  clientName,
  installationName,
  onClose,
  onMessageSent,
}: ContactFlowChatProps) {
  const [messages, setMessages] = useState<ContactFlowMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingMedia, setSendingMedia] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  async function loadMessages(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError(null);

      const response = await fetch(
        `/api/contact-flows/${contactFlowId}/messages`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("No se pudo cargar la conversación.");
      }

      const result: MessagesApiResponse = await response.json();

      if (!result.success) {
        throw new Error("No se pudo obtener la conversación.");
      }

      setMessages(result.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar la conversación.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMessages();
  }, [contactFlowId]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadMessages(false);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [contactFlowId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  async function handleSendMessage(customMessage?: string) {
    const trimmedMessage = (customMessage ?? inputMessage).trim();

    if (!trimmedMessage) return;

    try {
      setSending(true);
      setError(null);

      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactFlowId,
          message: trimmedMessage,
        }),
      });

      const result: SendMessageApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.details || result.error || "No se pudo enviar el mensaje.",
        );
      }

      setInputMessage("");
      await loadMessages(false);
      await onMessageSent();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al enviar el mensaje.",
      );
    } finally {
      setSending(false);
    }
  }

  async function handleSendMedia() {
    if (!contactFlowId || !selectedFile) return;

    try {
      setSendingMedia(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("entity_type", "contact_flow");
      formData.append("entity_id", contactFlowId);

      const uploadResponse = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });

      const uploadResult = await uploadResponse.json();

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactFlowId,
          mediaUrl: uploadedFile.file_url,
          mediaType: isImage ? "image" : "document",
          filename: selectedFile.name,
          caption: inputMessage.trim() || undefined,
        }),
      });

      const mediaResult = await mediaResponse.json();

      if (!mediaResponse.ok || !mediaResult.success) {
        throw new Error(mediaResult.error || "No se pudo enviar el archivo.");
      }

      setSelectedFile(null);
      setInputMessage("");

      await loadMessages(false);
      await onMessageSent();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error enviando el archivo.",
      );
    } finally {
      setSendingMedia(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey && !selectedFile) {
      event.preventDefault();
      void handleSendMessage();
    }
  }

  function handleQuickReply(option: "1" | "2" | "3" | "4") {
    void handleSendMessage(option);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="flex h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#f0f2f5] px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
              {clientName
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase()}
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-slate-900">
                {clientName}
              </h2>
              <p className="truncate text-xs text-slate-500">
                {installationName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#efeae2] px-4 py-6">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
              Cargando conversación...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : messages.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
              No hay mensajes registrados para este flujo.
            </div>
          ) : (
            messages.map((message) => {
              const isOutbound = message.direction === "OUTBOUND";

              return (
                <div
                  key={message.message_id}
                  className={`mb-3 flex ${
                    isOutbound ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`relative max-w-[280px] rounded-2xl px-3 py-2 shadow-sm ${
                      isOutbound
                        ? "rounded-br-md bg-[#d9fdd3] text-slate-900"
                        : "rounded-bl-md bg-white text-slate-900"
                    }`}
                  >
                    {renderMessageContent(message, setPreviewImageUrl)}

                    <div className="mt-1 flex justify-end">
                      <span className="text-[10px] text-slate-500">
                        {formatDateTime(
                          message.sent_at ||
                            message.received_at ||
                            message.created_at,
                        )}
                      </span>

                      {message.direction === "OUTBOUND" && (
                        <span className="ml-1 text-[10px] text-slate-500">
                          {getDeliveryLabel(message.delivery_status)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-slate-200 bg-[#f0f2f5] p-3">
          <div className="mb-3 flex flex-wrap gap-2">
            {(["1", "2", "3", "4"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleQuickReply(option)}
                disabled={sending || sendingMedia}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {selectedFile && (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <span className="min-w-0 truncate">
                  Archivo seleccionado:{" "}
                  <span className="font-semibold">{selectedFile.name}</span>
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  disabled={sendingMedia}
                  className="shrink-0 text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Quitar
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <label className="flex cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                📎
                <input
                  type="file"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setSelectedFile(file);
                  }}
                />
              </label>

              <input
                autoFocus
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  selectedFile
                    ? "Agregar descripción opcional..."
                    : "Escribe un mensaje..."
                }
                className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
              />

              {selectedFile ? (
                <button
                  type="button"
                  onClick={() => void handleSendMedia()}
                  disabled={sendingMedia}
                  className="rounded-full bg-sky-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sendingMedia ? "..." : "Enviar archivo"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleSendMessage()}
                  disabled={!inputMessage.trim() || sending}
                  className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? "..." : "Enviar"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {previewImageUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4">
          <div className="relative max-h-[90vh] w-full max-w-5xl">
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute right-0 top-0 z-10 -translate-y-12 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Cerrar
            </button>

            <img
              src={previewImageUrl}
              alt="Vista ampliada"
              className="max-h-[90vh] w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContactAttemptsPage() {
  const [flows, setFlows] = useState<ContactFlowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [mounted, setMounted] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<ContactFlowItem | null>(
    null,
  );
  const [refreshing, setRefreshing] = useState(false);

  async function loadFlows(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      const response = await fetch("/api/contact-flows", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("No se pudo cargar la gestión de contactos.");
      }

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error("La respuesta del servidor no fue exitosa.");
      }

      setFlows(result.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar los contactos.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadFlows();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleRefreshList() {
    void loadFlows(false);
  }

  function handleOpenConversation(flow: ContactFlowItem) {
    setFlows((currentFlows) =>
      currentFlows.map((item) =>
        item.contact_flow_id === flow.contact_flow_id
          ? {
              ...item,
              unread_count: 0,
              has_unread_messages: false,
            }
          : item,
      ),
    );

    setSelectedFlow({
      ...flow,
      unread_count: 0,
      has_unread_messages: false,
    });
  }

  const counters = useMemo(
    () => ({
      all: flows.length,
      unread: flows.filter((flow) => hasUnreadMessages(flow)).length,
      waiting: flows.filter(
        (flow) =>
          flow.status === "WAITING_RESPONSE" || flow.status === "OPTIONS_SENT",
      ).length,
      confirmed: flows.filter((flow) => flow.status === "CONFIRMED").length,
      manual: flows.filter((flow) => flow.status === "MANUAL_REQUIRED").length,
    }),
    [flows],
  );

  const filteredFlows = useMemo(() => {
    if (filter === "all") return flows;

    if (filter === "unread") {
      return flows.filter((flow) => hasUnreadMessages(flow));
    }

    if (filter === "waiting") {
      return flows.filter(
        (flow) =>
          flow.status === "WAITING_RESPONSE" || flow.status === "OPTIONS_SENT",
      );
    }

    if (filter === "confirmed") {
      return flows.filter((flow) => flow.status === "CONFIRMED");
    }

    return flows.filter((flow) => flow.status === "MANUAL_REQUIRED");
  }, [filter, flows]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Gestión de contacto
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Intentos de contacto
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Visualiza el estado de los contactos automáticos y las
              confirmaciones de mantenimiento.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={handleRefreshList}
              disabled={refreshing}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refreshing ? "Refrescando..." : "Refrescar lista"}
            </button>

            {mounted && (
              <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    viewMode === "list"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Lista
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    viewMode === "grid"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Grid
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                { key: "all" as const, label: "Todos", count: counters.all },
                {
                  key: "unread" as const,
                  label: "Sin leer",
                  count: counters.unread,
                },
                {
                  key: "waiting" as const,
                  label: "En gestión",
                  count: counters.waiting,
                },
                {
                  key: "confirmed" as const,
                  label: "Confirmados",
                  count: counters.confirmed,
                },
                {
                  key: "manual" as const,
                  label: "Manual",
                  count: counters.manual,
                },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                    filter === item.key
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>{item.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${
                        filter === item.key
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Cargando contactos...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      ) : filteredFlows.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          No hay contactos para mostrar con el filtro seleccionado.
        </div>
      ) : viewMode === "list" ? (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[1.3fr_1.4fr_1fr_1fr_120px_120px_145px_130px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 xl:grid">
            <span>Cliente</span>
            <span>Instalación</span>
            <span>Estado</span>
            <span>Riesgo</span>
            <span>Objetivo</span>
            <span>Agendada</span>
            <span>Última interacción</span>
            <span>Acciones</span>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredFlows.map((flow) => {
              const risk = getOperationalRisk(flow);

              return (
                <article
                  key={flow.contact_flow_id}
                  className={`grid gap-4 px-5 py-4 transition xl:grid-cols-[1.3fr_1.4fr_1fr_1fr_120px_120px_145px_130px] xl:items-center ${
                    hasUnreadMessages(flow)
                      ? "bg-emerald-50/60 hover:bg-emerald-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {getClientFullName(flow.client)}
                      </p>

                      {hasUnreadMessages(flow) && (
                        <span className="shrink-0 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          {flow.unread_count}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {flow.client.phone_primary}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {flow.installation?.description ||
                        "Instalación sin descripción"}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                      {flow.follow_up.reason || "Sin motivo registrado"}
                    </p>
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                        flow.status,
                      )}`}
                    >
                      {getStatusLabel(flow.status)}
                    </span>
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${risk.classes}`}
                    >
                      {risk.label}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 xl:hidden">
                      Fecha objetivo
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      {formatDate(flow.follow_up.target_date)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 xl:hidden">
                      Fecha agendada
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      {formatDate(
                        flow.selected_date || flow.follow_up.scheduled_date,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 xl:hidden">
                      Última interacción
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      {formatDateTime(flow.last_message_at)}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {getMessageTypeLabel(flow.last_message?.direction)}
                    </p>

                    {flow.last_message && (
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                        {getLastMessagePreview(flow.last_message)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <button
                      type="button"
                      onClick={() => handleOpenConversation(flow)}
                      className="relative rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Conversación
                      {hasUnreadMessages(flow) && (
                        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                          {flow.unread_count}
                        </span>
                      )}
                    </button>

                    {flow.installation?.installation_id && (
                      <button
                        type="button"
                        onClick={() => {
                          window.location.href = `/installations/${flow.installation?.installation_id}`;
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        Instalación
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = `/follow-ups/${flow.follow_up.follow_up_id}`;
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Mant.
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {filteredFlows.map((flow) => {
            const risk = getOperationalRisk(flow);

            return (
              <article
                key={flow.contact_flow_id}
                className={`rounded-3xl border p-5 shadow-sm transition hover:shadow-md ${
                  hasUnreadMessages(flow)
                    ? "border-emerald-200 bg-emerald-50/60 hover:border-emerald-300"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-bold text-slate-900">
                        {getClientFullName(flow.client)}
                      </h2>

                      {hasUnreadMessages(flow) && (
                        <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          {flow.unread_count} nuevo
                          {flow.unread_count === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 truncate text-sm text-slate-500">
                      {flow.installation?.description ||
                        "Instalación sin descripción"}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                      flow.status,
                    )}`}
                  >
                    {getStatusLabel(flow.status)}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${risk.classes}`}
                  >
                    {risk.label}
                  </span>

                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    Prioridad {flow.follow_up.priority}
                  </span>

                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    {flow.client.phone_primary}
                  </span>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Último mensaje
                    </p>
                    <p className="text-xs font-semibold text-slate-400">
                      {getMessageTypeLabel(flow.last_message?.direction)}
                    </p>
                  </div>

                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-700">
                    {getLastMessagePreview(flow.last_message)}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Objetivo
                    </p>

                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {formatDate(flow.follow_up.target_date)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Agendada
                    </p>

                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {formatDate(
                        flow.selected_date || flow.follow_up.scheduled_date,
                      )}
                    </p>
                  </div>

                  <div className="col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Última interacción
                    </p>

                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {formatDateTime(flow.last_message_at)}
                    </p>
                  </div>
                </div>

                {flow.manual_reason && (
                  <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {flow.manual_reason}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenConversation(flow)}
                    className="relative rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Conversación
                    {hasUnreadMessages(flow) && (
                      <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                        {flow.unread_count}
                      </span>
                    )}
                  </button>

                  {flow.installation?.installation_id && (
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = `/installations/${flow.installation?.installation_id}`;
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Instalación
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `/follow-ups/${flow.follow_up.follow_up_id}`;
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Mant.
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedFlow && (
        <ContactFlowChat
          contactFlowId={selectedFlow.contact_flow_id}
          clientName={getClientFullName(selectedFlow.client)}
          installationName={
            selectedFlow.installation?.description ||
            "Instalación sin descripción"
          }
          onClose={() => setSelectedFlow(null)}
          onMessageSent={loadFlows}
        />
      )}
    </div>
  );
}
