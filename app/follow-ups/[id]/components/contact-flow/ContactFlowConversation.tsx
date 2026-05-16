"use client";

import { useState, type KeyboardEvent, type RefObject } from "react";

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
}: ContactFlowConversationProps) {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-[#f0f2f5] px-5 py-4">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Conversación completa
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Mensajes asociados a esta gestión de contacto.
              </p>
            </div>

            <span className="text-xs font-semibold text-slate-400">
              {messages.length} mensaje{messages.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="max-h-[360px] min-h-[260px] overflow-y-auto bg-[#efeae2] px-4 py-6">
          {messagesLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
              Cargando conversación...
            </div>
          ) : messagesError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {messagesError}
            </div>
          ) : messages.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
              No hay mensajes registrados para esta gestión.
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
                onClick={() => void onSendMessage(option)}
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
                  onClick={() => onSelectedFileChange(null)}
                  disabled={sendingMedia}
                  className="shrink-0 text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Quitar
                </button>
              </div>
            )}

            <div className="flex flex-col gap-3 md:flex-row">
              <label className="flex cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
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
                className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
              />

              {selectedFile ? (
                <button
                  type="button"
                  onClick={() => void onSendMedia()}
                  disabled={sendingMedia}
                  className="rounded-full bg-sky-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sendingMedia ? "..." : "Enviar archivo"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void onSendMessage()}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
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
    </>
  );
}
