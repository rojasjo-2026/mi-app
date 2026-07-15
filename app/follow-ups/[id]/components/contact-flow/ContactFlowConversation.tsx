"use client";

import { useState, type KeyboardEvent, type RefObject } from "react";

import {
  buildInitialContactMessageTemplate,
  buildReminderMessageTemplate,
} from "@/lib/services/contact-flow/contactFlowMessageTemplatesService";

import MessageContent from "./MessageContent";
import { formatDateTime, getDeliveryLabel } from "./contactFlowFormatters";
import type { ContactFlowMessage } from "./contactFlowTypes";

type ContactFlowConversationProps = {
  messages: ContactFlowMessage[];
  messagesLoading: boolean;
  messagesError: string;
  sending: boolean;
  sendingMedia: boolean;
  selectedFile: File | null;
  inputMessage: string;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onSendMessage: (customMessage?: string) => void | Promise<void>;
  onSendMedia: () => void | Promise<void>;
  onSelectedFileChange: (file: File | null) => void;
  onInputMessageChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  clientName?: string | null;
  installationName?: string | null;
};

export default function ContactFlowConversation({
  messages,
  messagesLoading,
  messagesError,
  sending,
  sendingMedia,
  selectedFile,
  inputMessage,
  messagesEndRef,
  onSendMessage,
  onSendMedia,
  onSelectedFileChange,
  onInputMessageChange,
  onKeyDown,
  clientName,
  installationName,
}: ContactFlowConversationProps) {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const initialMessage = buildInitialContactMessageTemplate({
    clientName: clientName ?? undefined,
    installationName: installationName ?? undefined,
  });

  const reminderMessage = buildReminderMessageTemplate({
    clientName: clientName ?? undefined,
    installationName: installationName ?? undefined,
  });

  return (
    <>
      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Conversación completa
              </p>

              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                Mensajes asociados a esta gestión de contacto.
              </p>
            </div>

            <span className="text-xs font-medium text-slate-500">
              {messages.length} mensaje{messages.length === 1 ? "" : "s"}
            </span>
          </div>
        </header>

        <div className="max-h-[360px] min-h-[240px] overflow-y-auto bg-[#efeae2] px-3 py-4">
          {messagesLoading ? (
            <div className="rounded-md border border-slate-200 bg-white px-3 py-3 text-sm text-slate-500">
              Cargando conversación...
            </div>
          ) : messagesError ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
              {messagesError}
            </div>
          ) : messages.length === 0 ? (
            <div className="rounded-md border border-slate-200 bg-white px-3 py-3 text-sm text-slate-500">
              No hay mensajes registrados para esta gestión.
            </div>
          ) : (
            messages.map((message) => {
              const isOutbound = message.direction === "OUTBOUND";

              return (
                <div
                  key={message.message_id}
                  className={`mb-2.5 flex ${
                    isOutbound ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`relative max-w-[300px] rounded-md px-3 py-2 shadow-sm ${
                      isOutbound
                        ? "bg-[#d9fdd3] text-slate-900"
                        : "bg-white text-slate-900"
                    }`}
                  >
                    <MessageContent
                      message={message}
                      onOpenImage={setPreviewImageUrl}
                    />

                    <div className="mt-1 flex justify-end">
                      <span className="text-[10px] text-slate-500">
                        {formatDateTime(
                          message.sent_at ||
                            message.received_at ||
                            message.created_at,
                        )}
                      </span>

                      {message.direction === "OUTBOUND" ? (
                        <span className="ml-1 text-[10px] text-slate-500">
                          {getDeliveryLabel(message.delivery_status)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div ref={messagesEndRef} />
        </div>

        <footer className="border-t border-slate-200 bg-slate-50 p-3">
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void onSendMessage(initialMessage)}
              disabled={sending || sendingMedia}
              className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mensaje inicial
            </button>

            <button
              type="button"
              onClick={() => void onSendMessage(reminderMessage)}
              disabled={sending || sendingMedia}
              className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Recordatorio
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {selectedFile ? (
              <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">
                <span className="min-w-0 truncate">
                  Archivo seleccionado:{" "}
                  <span className="font-semibold">{selectedFile.name}</span>
                </span>

                <button
                  type="button"
                  onClick={() => onSelectedFileChange(null)}
                  disabled={sendingMedia}
                  className="shrink-0 text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Quitar
                </button>
              </div>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
                📎
                <input
                  type="file"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    onSelectedFileChange(file);
                  }}
                />
              </label>

              <input
                value={inputMessage}
                onChange={(event) => onInputMessageChange(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder={
                  selectedFile
                    ? "Agregar descripción opcional..."
                    : "Escribe un mensaje..."
                }
                className="h-9 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />

              {selectedFile ? (
                <button
                  type="button"
                  onClick={() => void onSendMedia()}
                  disabled={sendingMedia}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sendingMedia ? "..." : "Enviar archivo"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void onSendMessage()}
                  disabled={!inputMessage.trim() || sending}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? "..." : "Enviar"}
                </button>
              )}
            </div>
          </div>
        </footer>
      </section>

      {previewImageUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="relative max-h-[90vh] w-full max-w-5xl">
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute right-0 top-0 z-10 -translate-y-11 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Cerrar
            </button>

            <img
              src={previewImageUrl}
              alt="Vista ampliada"
              className="max-h-[90vh] w-full rounded-md object-contain shadow-2xl"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
