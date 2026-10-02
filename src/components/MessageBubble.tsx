import MediaAttachment from '@/components/MediaAttachment';
import type { GeneratedBy, UiMessage } from '@/lib/types';

const PROVENANCE_LABELS: Partial<Record<GeneratedBy, string>> = {
  rule_engine: 'Rule engine',
  gemini: 'Gemini assist',
};

export default function MessageBubble({ message }: { message: UiMessage }) {
  const isUser = message.role === 'user';
  const provenance = PROVENANCE_LABELS[message.generated_by];

  const stateClasses = `${message.pending ? 'opacity-60' : ''} ${
    message.failed ? 'ring-1 ring-red-400 dark:ring-red-500' : ''
  }`;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="flex max-w-[85%] flex-col sm:max-w-[75%]">
        {message.media ? (
          <div
            className={`rounded-2xl border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-800 ${
              isUser ? 'rounded-br-md' : 'rounded-bl-md'
            } ${stateClasses}`}
          >
            <MediaAttachment media={message.media} />
          </div>
        ) : (
          <div
            className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              isUser
                ? 'rounded-br-md bg-blue-600 text-white'
                : 'rounded-bl-md bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
            } ${stateClasses}`}
          >
            {message.content}
          </div>
        )}
        {!isUser && provenance && (
          <span className="mt-1 pl-1 text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            {provenance}
          </span>
        )}
        {isUser && message.failed && (
          <span className="mt-1 pr-1 text-right text-[10px] text-red-500">
            Not sent
          </span>
        )}
      </div>
    </div>
  );
}
