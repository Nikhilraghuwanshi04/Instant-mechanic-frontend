import type { MediaUpload } from '@/lib/types';

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaAttachment({ media }: { media: MediaUpload }) {
  return (
    <div className="flex flex-col gap-2">
      {media.media_type === 'image' && (
        // eslint-disable-next-line @next/next/no-img-element -- media host runtime pe badalta hai (local / production), next/image config ke liye static host chahiye
        <img
          src={media.file}
          alt={media.original_name}
          className="max-h-64 w-auto rounded-xl"
        />
      )}
      {media.media_type === 'audio' && (
        <audio controls src={media.file} className="w-full sm:w-80" />
      )}
      {media.media_type === 'video' && (
        <video controls src={media.file} className="max-h-64 w-auto rounded-xl" />
      )}
      <span className="px-1 pb-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
        {media.original_name} · {formatBytes(media.size_bytes)}
      </span>
    </div>
  );
}
