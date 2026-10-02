# AI Car Mechanic Chatbot — Frontend

Next.js + TypeScript chat UI for an AI car mechanic: describe a car problem in text, image, audio or video; the bot asks focused follow-up questions, produces a structured diagnosis (likely issue, confidence, drive-safety advice, recommended service) and lets the user book a mechanic appointment.

Built as the frontend half of a full-stack assignment; the backend (Django + DRF, hybrid rule-engine + minimal-Gemini architecture) lives here: [Instant-mechanic-Backend](https://github.com/Nikhilraghuwanshi04/Instant-mechanic-Backend).

---

## Features

- **Chat interface** — message bubbles for user/assistant, typing indicator, auto-scroll, Enter-to-send.
- **Media attachments** — attach image / audio / video; instant client-side feedback on unsupported types or oversized files; media previews render inside the chat timeline.
- **Diagnosis card** — likely issue, reasoning, confidence badge, can-drive recommendation, next step and recommended service, rendered from the structured API response.
- **Mechanic booking** — modal form (name, phone, preferred date) with inline validation, then a confirmation card with the booking reference (`BK-XXXXXXXX`) and current status.
- **Conversation history** — sidebar listing past conversations with preview + message count; clicking one restores the full timeline (messages, media, diagnosis, booking).
- **Rule engine vs Gemini transparency** — every bot message and diagnosis shows a `RULE ENGINE` or `GEMINI` badge, driven by the backend's `generated_by` field. In normal use everything is RULE ENGINE; GEMINI appears only when the deterministic engine couldn't classify a message.
- **Polished states** — loading indicators, disabled inputs while sending, friendly error bubbles for backend/network problems (never raw internal errors), empty state.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + TypeScript 5 |
| Styling | Tailwind CSS 4 |
| API client | Typed `fetch` wrapper (`src/lib/api.ts`) |
| Linting | ESLint (eslint-config-next) |

No UI framework, no state library — plain React state, kept deliberately simple.

## Getting started

Requires Node 18+ and the backend running (see backend repo — defaults to `http://127.0.0.1:8010`).

```bash
cd frontend
npm install
# create .env.local with one line (see Environment variables below):
#   NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build     # production build
npm run lint      # eslint
```

## Environment variables

| Variable | Example | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://127.0.0.1:8010` | Base URL of the Django backend (no trailing slash) |

Only this one variable is needed. It is public by design (`NEXT_PUBLIC_`) and contains **no secrets** — the Gemini API key lives exclusively on the backend. `.env.local` is gitignored and never committed; if it is absent, the app falls back to `http://127.0.0.1:8010`.

## Project structure

```
frontend/
└── src/
    ├── app/
    │   ├── page.tsx            # main app: state machine for chat, uploads, diagnosis, booking, history
    │   ├── layout.tsx          # fonts + metadata
    │   └── globals.css         # Tailwind + theme tokens
    ├── components/
    │   ├── HistorySidebar.tsx  # past conversations list
    │   ├── MessageBubble.tsx   # chat bubble + RULE ENGINE/GEMINI badge
    │   ├── MediaAttachment.tsx # image/audio/video preview in the timeline
    │   ├── TypingIndicator.tsx # animated "thinking" dots
    │   ├── ChatInput.tsx       # text input + attach button + send
    │   ├── DiagnosisCard.tsx   # structured diagnosis display
    │   ├── BookingModal.tsx    # booking form with inline validation
    │   ├── BookingCard.tsx     # booking confirmation + status
    │   └── EmptyState.tsx      # welcome screen with example prompts
    └── lib/
        ├── api.ts              # the ONLY place that talks to the backend (typed functions + ApiError)
        ├── media.ts            # client-side file checks (mirror of backend limits, UX-only)
        └── types.ts            # TypeScript mirrors of every API request/response shape
```

## How it talks to the backend

All backend calls go through the typed functions in `src/lib/api.ts` — components never call `fetch` directly.

| UI action | API call |
|---|---|
| Send message | `POST /api/chat/` |
| Attach a file | `POST /api/upload/` (multipart) |
| Click "Get Diagnosis" | `POST /api/diagnosis/` |
| Submit booking modal | `POST /api/booking/` → then `GET /api/booking/{id}/` on refresh |
| Click a sidebar conversation | `GET /api/conversations/{id}/` |
| Load sidebar | `GET /api/conversations/` |

Error handling: the wrapper normalises DRF's two error shapes (`{"detail": ...}` / `{"field": [...]}`) into one plain message, and represents network/CORS failures as `ApiError` with `status: 0` ("Cannot reach the backend…"). Internal errors from the server are never surfaced raw.

The conversation-history endpoints are **additional** read-only APIs beyond the brief's five required endpoints — they exist purely to restore chat history in the sidebar and involve no extra AI usage.

## Security notes

- **No API keys in the frontend.** The app only knows the backend URL; Gemini lives on the server.
- **Client-side file checks are UX-only.** `src/lib/media.ts` mirrors the backend's type/size limits to fail fast before uploading, but the real enforcement is server-side (magic-byte detection + size caps) and still rejects bad files if this check is bypassed.
- **No internal errors shown to users.** Everything rendered comes from the backend's user-friendly error messages.

## Deployment (Vercel)

1. Import the `Instant-mechanic-frontend` repo in Vercel (framework auto-detected: Next.js).
2. Set the environment variable `NEXT_PUBLIC_API_BASE_URL` to the deployed backend URL (e.g. `http://<ec2-host>` or your domain).
3. Deploy. Then add the resulting Vercel URL to the backend's `CORS_ALLOWED_ORIGINS` and restart the backend.

## Related

- **Backend repo:** [Instant-mechanic-Backend](https://github.com/Nikhilraghuwanshi04/Instant-mechanic-Backend) — Django + DRF, SQLite, rule-engine-first diagnosis with Gemini as a last-resort NLU fallback. Full API documentation lives in its README.
