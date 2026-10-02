// Client-side media checks — backend ke chatbot/services/media_validator.py
// ka mirror. Yahan check sirf UX ke liye hai (upload se PEHLE user ko turant
// batao); asli SECURITY check backend pe hai (magic bytes + size), jo client
// validation bypass hone pe bhi file reject kar dega.

import type { MediaType } from './types';

// Backend settings.py: MAX_IMAGE_MB / MAX_AUDIO_MB / MAX_VIDEO_MB (defaults).
export const MAX_MB: Record<MediaType, number> = {
  image: 10,
  audio: 15,
  video: 25,
};

const ALLOWED_MIME_TYPES: Record<MediaType, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm'],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
};

// <input type="file"> ke accept attribute ke liye — file picker khud
// sirf in formats ko dikhata hai (par user "All files" bhi choose kar
// sakta hai, isliye checkMediaFile wala check zaroori hai).
export const MEDIA_ACCEPT = Object.values(ALLOWED_MIME_TYPES).flat().join(',');

export type MediaCheck =
  | { ok: true; mediaType: MediaType }
  | { ok: false; error: string };

export function checkMediaFile(file: File): MediaCheck {
  const mediaType = (['image', 'audio', 'video'] as MediaType[]).find((t) =>
    ALLOWED_MIME_TYPES[t].includes(file.type),
  );
  if (!mediaType) {
    return {
      ok: false,
      error:
        'Unsupported file type. Allowed: JPEG/PNG/WEBP images, MP3/WAV/OGG audio, MP4/MOV/WEBM video.',
    };
  }
  const maxMb = MAX_MB[mediaType];
  if (file.size > maxMb * 1024 * 1024) {
    const label = mediaType[0].toUpperCase() + mediaType.slice(1);
    return { ok: false, error: `${label} file is too large (max ${maxMb} MB).` };
  }
  return { ok: true, mediaType };
}
