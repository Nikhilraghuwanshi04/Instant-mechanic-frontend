const SUGGESTIONS = [
  'My car won’t start in the morning',
  'Squealing noise when I brake',
  'The check engine light is on',
];

export default function EmptyState({
  onPick,
}: {
  onPick: (text: string) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <h2 className="text-lg font-semibold">What’s wrong with your car?</h2>
      <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
        Describe the problem in your own words — when it happens and what you
        notice (noise, smell, warning light). The more detail, the better the
        diagnosis.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => onPick(text)}
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 transition hover:border-blue-400 hover:text-blue-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
