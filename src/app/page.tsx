'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import BookingCard from '@/components/BookingCard';
import BookingModal from '@/components/BookingModal';
import ChatInput from '@/components/ChatInput';
import DiagnosisCard from '@/components/DiagnosisCard';
import EmptyState from '@/components/EmptyState';
import HistorySidebar from '@/components/HistorySidebar';
import MessageBubble from '@/components/MessageBubble';
import TypingIndicator from '@/components/TypingIndicator';
import {
  ApiError,
  getBooking,
  getConversation,
  getConversations,
  getDiagnosis,
  sendChat,
  uploadMedia,
} from '@/lib/api';
import { checkMediaFile } from '@/lib/media';
import type {
  Booking,
  ConversationDetailResponse,
  ConversationSummary,
  Diagnosis,
  UiMessage,
} from '@/lib/types';

// Server history ko ek timeline mein jodo — messages aur media alag lists
// mein aate hain. Media ka pseudo-message banate hain (id negative, asli
// ids se clash na ho) taaki MessageBubble use wahi render kare jo live
// upload bubble ko karta hai.
function buildTimeline(detail: ConversationDetailResponse): UiMessage[] {
  const mediaMessages: UiMessage[] = detail.media.map((media) => ({
    id: -media.id,
    role: 'user',
    content: '',
    generated_by: 'user',
    created_at: media.created_at,
    media,
  }));
  return [...detail.messages, ...mediaMessages].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

export default function Home() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  // Booking diagnosis-card ke saath clear NAHI hoti — asli booking user ke
  // naya message bhejne pe gayab nahi honi chahiye.
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isRefreshingBooking, setIsRefreshingBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Sidebar ke liye halki summary list — poori history nahi.
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [loadingConversationId, setLoadingConversationId] = useState<
    number | null
  >(null);

  // Chat aur upload ek saath nahi chalte — warna dono alag-alag nayi
  // conversation bana sakte hain (dono ke paas conversationId null hoga).
  const isBusy = isSending || isUploading;

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending, isUploading, diagnosis, booking]);

  const loadConversations = useCallback(async () => {
    try {
      const response = await getConversations();
      setConversations(response.conversations);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not load conversation history.',
      );
    }
  }, []);

  // Mount pe aur jab bhi active conversation badle (nayi chat bane ya
  // switch ho) sidebar taaza karo.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await getConversations();
        if (!cancelled) setConversations(response.conversations);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Could not load conversation history.',
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId, loadConversations]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isBusy) return;

    // Optimistic bubble: user ka message TURANT dikhao, server ka reply
    // aane ka intezaar mat karo (Gemini wale messages 15s+ le sakte hain).
    const optimistic: UiMessage = {
      id: -Date.now(),
      role: 'user',
      content: text,
      generated_by: 'user',
      created_at: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    // Naya symptom = purana diagnosis stale. Card hata do — user dobara
    // "Get Diagnosis" chala kar taaza diagnosis le sakta hai.
    setDiagnosis(null);
    setError(null);
    setIsSending(true);

    try {
      const response = await sendChat(text, conversationId ?? undefined);
      setConversationId(response.conversation_id);
      setMessages((prev) => [
        ...prev.map((m) => (m.id === optimistic.id ? response.user_message : m)),
        response.reply,
      ]);
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimistic.id
            ? { ...m, pending: false, failed: true }
            : m,
        ),
      );
      setError(
        err instanceof ApiError
          ? err.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsSending(false);
    }
  }

  async function handleAttach(file: File) {
    if (isBusy) return;

    const check = checkMediaFile(file);
    if (!check.ok) {
      setError(check.error);
      return;
    }

    // Optimistic media bubble: local object URL se turant preview dikhao.
    // Upload success pe isi bubble ka media server ke record se replace ho
    // jata hai (asli URL), aur local preview URL revoke kar dete hain.
    const optimisticId = -Date.now();
    const localPreviewUrl = URL.createObjectURL(file);
    const optimistic: UiMessage = {
      id: optimisticId,
      role: 'user',
      content: '',
      generated_by: 'user',
      created_at: new Date().toISOString(),
      pending: true,
      media: {
        id: optimisticId,
        file: localPreviewUrl,
        media_type: check.mediaType,
        original_name: file.name,
        size_bytes: file.size,
        mime_type: file.type,
        analysis_status: 'pending',
        created_at: new Date().toISOString(),
      },
    };
    setMessages((prev) => [...prev, optimistic]);
    setDiagnosis(null);
    setError(null);
    setIsUploading(true);

    try {
      const response = await uploadMedia(file, conversationId ?? undefined);
      setConversationId(response.conversation_id);
      URL.revokeObjectURL(localPreviewUrl);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticId
            ? { ...m, media: response.media, pending: false }
            : m,
        ),
      );
    } catch (err) {
      // Preview URL revoke nahi karte — user ko dikhna chahiye kya fail hua.
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticId ? { ...m, pending: false, failed: true } : m,
        ),
      );
      setError(
        err instanceof ApiError
          ? err.message
          : 'Upload failed. Please try again.',
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleGetDiagnosis() {
    if (conversationId === null || isBusy || isDiagnosing) return;
    setError(null);
    setIsDiagnosing(true);
    try {
      const response = await getDiagnosis(conversationId);
      setDiagnosis(response.diagnosis);
      // Status 'diagnosed' ho gaya — sidebar ka status dot update karo.
      loadConversations();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not generate a diagnosis. Please try again.',
      );
    } finally {
      setIsDiagnosing(false);
    }
  }

  function handleBooked(newBooking: Booking) {
    setBooking(newBooking);
    setIsBookingOpen(false);
    // Status 'booked' ho gaya — sidebar ka dot green karo.
    loadConversations();
  }

  async function handleRefreshBooking() {
    if (booking === null || isRefreshingBooking) return;
    setError(null);
    setIsRefreshingBooking(true);
    try {
      const response = await getBooking(booking.id);
      setBooking(response.booking);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not refresh the booking status.',
      );
    } finally {
      setIsRefreshingBooking(false);
    }
  }

  async function handleSelectConversation(id: number) {
    // Drawer har click pe band — mobile pe user ko chat dikhni chahiye.
    setIsHistoryOpen(false);
    if (
      id === conversationId ||
      isBusy ||
      isDiagnosing ||
      loadingConversationId !== null
    ) {
      return;
    }
    setError(null);
    setLoadingConversationId(id);
    try {
      const detail = await getConversation(id);
      setConversationId(detail.conversation.id);
      setMessages(buildTimeline(detail));
      setDiagnosis(detail.diagnosis);
      setBooking(detail.booking);
      setInput('');
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not load this conversation. Please try again.',
      );
    } finally {
      setLoadingConversationId(null);
    }
  }

  function handleNewChat() {
    // In-flight request ke dauraan reset karna race paida karega —
    // purani request complete hokar sab wapas overwrite kar degi.
    if (isBusy || isDiagnosing || loadingConversationId !== null) return;
    setIsHistoryOpen(false);
    setConversationId(null);
    setMessages([]);
    setInput('');
    setDiagnosis(null);
    setBooking(null);
    setIsBookingOpen(false);
    setError(null);
  }

  function handlePickSuggestion(text: string) {
    setInput(text);
    inputRef.current?.focus();
  }

  return (
    <div className="flex h-dvh bg-white dark:bg-zinc-950">
      <HistorySidebar
        conversations={conversations}
        activeId={conversationId}
        loadingId={loadingConversationId}
        isOpen={isHistoryOpen}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        onClose={() => setIsHistoryOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              aria-label="Open history"
              className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 lg:hidden dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="h-5 w-5"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              AI
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold leading-tight">
                AI Car Mechanic
              </h1>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                Senior technician — ask about any car problem
              </p>
            </div>
            {conversationId !== null && (
              <button
                type="button"
                onClick={handleGetDiagnosis}
                disabled={isBusy || isDiagnosing}
                className="ml-auto shrink-0 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {isDiagnosing ? 'Analyzing…' : 'Get Diagnosis'}
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
            {messages.length === 0 && !isBusy && (
              <EmptyState onPick={handlePickSuggestion} />
            )}
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isSending && <TypingIndicator />}
            {diagnosis && (
              <DiagnosisCard
                diagnosis={diagnosis}
                booking={booking}
                onBook={() => setIsBookingOpen(true)}
              />
            )}
            {booking && (
              <BookingCard
                booking={booking}
                onRefresh={handleRefreshBooking}
                isRefreshing={isRefreshingBooking}
              />
            )}
            <div ref={bottomRef} />
          </div>
        </main>

        {error && (
          <div className="border-t border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40">
            <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-2.5">
              <p role="alert" className="text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="shrink-0 text-xs font-medium text-red-600 hover:underline dark:text-red-400"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <footer className="border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mx-auto w-full max-w-3xl">
            <ChatInput
              ref={inputRef}
              value={input}
              onChange={setInput}
              onSend={handleSend}
              onAttach={handleAttach}
              isSending={isBusy}
            />
          </div>
        </footer>
      </div>

      {isBookingOpen && diagnosis && (
        <BookingModal
          diagnosis={diagnosis}
          onClose={() => setIsBookingOpen(false)}
          onBooked={handleBooked}
        />
      )}
    </div>
  );
}
