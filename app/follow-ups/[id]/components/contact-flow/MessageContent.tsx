"use client";

import type { ContactFlowMessage } from "./contactFlowTypes";
import {
  getMessageFileName,
  getMessageMediaUrl,
} from "./contactFlowFormatters";

type MessageContentProps = {
  message: ContactFlowMessage;
  onOpenImage?: (imageUrl: string) => void;
};

export default function MessageContent({
  message,
  onOpenImage,
}: MessageContentProps) {
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
