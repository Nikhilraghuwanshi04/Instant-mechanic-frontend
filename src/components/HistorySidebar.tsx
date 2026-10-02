'use client';

import type { ConversationStatus, ConversationSummary } from '@/lib/types';

// Status dot ke rang — sidebar mein ek nazar mein pata chale conversation
// kahan tak pahunchi hai.
const STATUS_DOTS: Record<ConversationStatus, string> = {
  active: 'bg-blue-500',
  diagnosed: 'bg-purple-500',
  booked: 'bg-green-500',
  closed: 'bg-zinc-400',
};

// Aaj ki conversation ho to time dikhao, purani ho to date.
function formatWhen(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  return isToday
    ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

interface HistorySidebarProps {
  conversations: ConversationSummary[];
  activeId: number | null;
  loadingId: number | null;
  isOpen: boolean;
  onSelect: (conversationId: number) => void;
  onNewChat: () => void;
  onClose: () => void;
}

export default function HistorySidebar({
  conversations,
  activeId,
  loadingId,
  isOpen,
  onSelect,
  onNewChat,
  onClose,
}: HistorySidebarProps) {
  return (
    <>
      {/* Mobile drawer ke peeche ka dhundhla backdrop — desktop pe kabhi nahi. */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-zinc-200 bg-white transition-transform dark:border-zinc-800 dark:bg-zinc-950 lg:static lg:z-auto lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-semibold">History</h2>
          <button
            type="button"
            onClick={onNewChat}
            className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            + New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
              No conversations yet. Ask about your car to start one.
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5 p-2">
              {conversations.map((conversation) => {
                const isActive = conversation.id === activeId;
                const isLoading = conversation.id === loadingId;
                return (
                  <li key={conversation.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(conversation.id)}
                      disabled={loadingId !== null}
                      className={`w-full rounded-xl px-3 py-2 text-left transition disabled:cursor-not-allowed ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-950/40'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOTS[conversation.status]}`}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                          {conversation.title}
                        </span>
                        <span className="shrink-0 text-[10px] text-zinc-400 dark:text-zinc-500">
                          {formatWhen(conversation.updated_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate pl-4 text-xs text-zinc-400 dark:text-zinc-500">
                        {isLoading
                          ? 'Loading…'
                          : conversation.last_message_preview ??
                            'No messages yet'}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
