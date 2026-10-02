import { useRef } from 'react';
import type { ChangeEvent, KeyboardEvent, Ref } from 'react';

import { MEDIA_ACCEPT } from '@/lib/media';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onAttach: (file: File) => void;
  isSending: boolean;
  ref?: Ref<HTMLTextAreaElement>;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  onAttach,
  isSending,
  ref,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canSend = value.trim().length > 0 && !isSending;

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onChange(event.target.value);
    // Textarea ko content ke saath grow karo (max ~160px, phir andar scroll).
    const el = event.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      if (canSend) onSend();
    }
  }

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Input ko reset karo — warna same file dobara select karne pe
    // 'change' event fire hi nahi hota.
    event.target.value = '';
    if (file) onAttach(file);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (canSend) onSend();
      }}
      className="flex items-end gap-2"
    >
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isSending}
        aria-label="Attach an image, audio or video"
        title="Attach image / audio / video"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-300 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
          />
        </svg>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept={MEDIA_ACCEPT}
        onChange={handleFileSelected}
        className="hidden"
      />
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        rows={1}
        maxLength={2000}
        autoFocus
        placeholder="Describe your car problem... (Enter to send, Shift+Enter for a new line)"
        className="flex-1 resize-none rounded-2xl border border-zinc-300 bg-white px-4 py-2.5 text-sm leading-relaxed text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
      />
      <button
        type="submit"
        disabled={!canSend}
        className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Send
      </button>
    </form>
  );
}
