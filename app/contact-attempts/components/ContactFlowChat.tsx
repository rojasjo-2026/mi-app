"use client";

import { useEffect, useRef, useState } from "react";

import type {
  ContactFlowMessage,
  MessagesApiResponse,
  SendMessageApiResponse,
} from "../types";
import {
  formatDateTime,
  getDeliveryLabel,
  getMessageFileName,
  getMessageMediaUrl,
} from "../utils";

type Props = {
  contactFlowId: string;
  clientName?: string;
  installationName?: string;
  onClose: () => void;
  onMessageSent?: () => Promise<void> | void;
};

function buildInitialWhatsAppTemplate(
  clientName?: string,
  installationName?: string,
) {
  const safeClientName = clientName?.trim() || "cliente";
  const safeInstallationName = installationName?.trim() || "su instalación";

  return `Hola ${safeClientName},

Le contactamos porque el mantenimiento de ${safeInstallationName} se aproxima.

Por favor responda con una de las siguientes opciones:

1. Confirmar mantenimiento
2. Reprogramar
3. Ya no me interesa
4. Hablar con un asesor`;
}

function buildReminderWhatsAppTemplate(
  clientName?: string,
  installationName?: string,
) {
  const safeClientName = clientName?.trim() || "cliente";
  const safeInstallationName = installationName?.trim() || "su instalación";

  return `Hola ${safeClientName},

Le damos seguimiento al mantenimiento pendiente de ${safeInstallationName}.

Por favor responda con una de las siguientes opciones:

1. Confirmar mantenimiento
2. Reprogramar
3. Ya no me interesa
4. Hablar con un asesor`;
}

function getFriendlyWhatsAppError(result: SendMessageApiResponse) {
  if (result.error === "WhatsApp is disabled in the general settings.") {
    return "WhatsApp está desactivado en la configuración general.";
  }

  if (result.error === "Client does not allow WhatsApp contact.") {
    return "El cliente no permite contacto por WhatsApp.";
  }

  if (result.error === "Client does not have a primary phone number.") {
    return "El cliente no tiene un teléfono principal configurado.";
  }

  if (
    result.error ===
    "WhatsApp messages must be linked to a maintenance contact flow."
  ) {
    return "El mensaje debe estar asociado a una gestión de contacto de mantenimiento.";
  }

  return result.details || result.error || "No se pudo enviar el mensaje.";
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

export default function ContactFlowChat({
  contactFlowId,
  clientName = "Cliente",
  installationName = "Instalación sin descripción",
  onClose,
  onMessageSent,
}: Props) {
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
        throw new Error(getFriendlyWhatsAppError(result));
      }

      setInputMessage("");
      await loadMessages(false);
      await onMessageSent?.();
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
      await onMessageSent?.();
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
            <button
              type="button"
              onClick={() =>
                void handleSendMessage(
                  buildInitialWhatsAppTemplate(clientName, installationName),
                )
              }
              disabled={sending || sendingMedia}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mensaje inicial
            </button>

            <button
              type="button"
              onClick={() =>
                void handleSendMessage(
                  buildReminderWhatsAppTemplate(clientName, installationName),
                )
              }
              disabled={sending || sendingMedia}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Recordatorio
            </button>
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
