"use client";

import { useEffect, useState } from "react";

type Message = {
  message_id: string;
  direction: "OUTBOUND" | "INBOUND";
  message_text: string;
  created_at: string;
};

type Props = {
  contactFlowId: string;
  onClose: () => void;
};

export default function ContactFlowChat({ contactFlowId, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await fetch(`/api/contact-flows/${contactFlowId}/messages`);
        const data = await res.json();

        setMessages(data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, [contactFlowId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Conversación</h2>

          <button
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-black"
          >
            Cerrar
          </button>
        </div>

        {/* Body */}
        <div className="h-[500px] overflow-y-auto space-y-3 p-4 bg-slate-50">
          {loading ? (
            <p>Cargando...</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.message_id}
                className={`flex ${
                  msg.direction === "OUTBOUND" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                    msg.direction === "OUTBOUND"
                      ? "bg-emerald-500 text-white"
                      : "bg-white border"
                  }`}
                >
                  {msg.message_text}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
