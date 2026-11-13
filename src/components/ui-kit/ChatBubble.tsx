import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, CheckCheck, SendHorizontal } from 'lucide-react';

export interface ChatMessage {
  id: number;
  author: 'yo' | 'otro';
  name: string;
  text: string;
  time: string;
  /** Solo en los mensajes propios. */
  status?: 'enviado' | 'leído';
}

interface ChatBubbleProps {
  message: ChatMessage;
}

/** Burbuja de mensaje: los propios a la derecha en cian y los ajenos a la izquierda. El estado se dice con texto. */
export function ChatBubble({ message }: ChatBubbleProps) {
  const mine = message.author === 'yo';
  return (
    <li className={`flex flex-col gap-1 ${mine ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          mine ? 'rounded-br-md bg-[#0ea5e9] text-[#0a0d14]' : 'rounded-bl-md border border-slate-700 bg-[#171d2b] text-slate-100'
        }`}
      >
        <span className="sr-only">{mine ? 'Tú: ' : `${message.name}: `}</span>
        {message.text}
      </div>
      <div className="flex items-center gap-1.5 px-1 text-[11px] text-slate-500">
        {!mine && <span>{message.name} ·</span>}
        <time>{message.time}</time>
        {mine && message.status && (
          <span className="inline-flex items-center gap-0.5 text-slate-400">
            {message.status === 'leído' ? (
              <CheckCheck aria-hidden="true" className="h-3.5 w-3.5 text-[#38bdf8]" />
            ) : (
              <Check aria-hidden="true" className="h-3.5 w-3.5" />
            )}
            <span className="sr-only">{message.status}</span>
          </span>
        )}
      </div>
    </li>
  );
}

/** Indicador de «escribiendo…»; con movimiento reducido los puntos quedan quietos. */
export function TypingIndicator({ name }: { name: string }) {
  return (
    <li className="flex items-start" role="status">
      <div className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md border border-slate-700 bg-[#171d2b] px-3.5 py-3">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-slate-400 motion-safe:animate-pulse"
            style={{ animationDelay: `${dot * 160}ms` }}
          />
        ))}
        <span className="sr-only">{name} está escribiendo</span>
      </div>
    </li>
  );
}

const now = () => new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

const SEED: ChatMessage[] = [
  { id: 1, author: 'otro', name: 'Lucía', text: '¿Probaste la skill de diseño con el acordeón?', time: '10:02' },
  { id: 2, author: 'yo', name: 'Yo', text: 'Sí, funcionó a la primera con Opus.', time: '10:03', status: 'leído' },
  { id: 3, author: 'otro', name: 'Lucía', text: 'Genial, súbela como clase y la enlazamos.', time: '10:04' },
];

/** Demo del registro: conversación con envío, respuesta simulada y desplazamiento al último mensaje. */
export function Demo() {
  const [messages, setMessages] = useState<ChatMessage[]>(SEED);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages, typing]);

  const send = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((list) => [...list, { id: Date.now(), author: 'yo', name: 'Yo', text, time: now(), status: 'enviado' }]);
    setDraft('');
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      setMessages((list) => [
        ...list.map((m) => (m.author === 'yo' ? { ...m, status: 'leído' as const } : m)),
        { id: Date.now() + 1, author: 'otro', name: 'Lucía', text: 'Anotado 👍', time: now() },
      ]);
    }, 1100);
  };

  return (
    <div className="flex h-80 w-full max-w-md flex-col overflow-hidden rounded-xl border border-slate-800 bg-[#121722]">
      <ul
        role="log"
        aria-label="Conversación"
        aria-live="polite"
        className="m-0 flex flex-1 list-none flex-col gap-3 overflow-y-auto p-4"
      >
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
        {typing && <TypingIndicator name="Lucía" />}
        <li ref={endRef} aria-hidden="true" />
      </ul>
      <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-800 p-3">
        <label htmlFor="chat-draft" className="sr-only">
          Escribe un mensaje
        </label>
        <input
          id="chat-draft"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={500}
          placeholder="Escribe un mensaje…"
          autoComplete="off"
          className="h-10 min-w-0 flex-1 rounded-full border border-slate-700 bg-[#0a0d14] px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#0ea5e9]"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Enviar mensaje"
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-[#0ea5e9] text-[#0a0d14] transition-colors hover:bg-[#38bdf8] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
        >
          <SendHorizontal aria-hidden="true" className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
