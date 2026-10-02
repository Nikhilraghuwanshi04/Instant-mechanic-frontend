// Backend se baat karne ka SIRF EK darwaza — UI components kahin bhi seedha
// fetch() nahi karenge, hamesha in typed functions se backend call karenge.
// (Backend pe gemini_client.py ka same idea tha: ek jagah se sab calls jaate hain.)

import type {
  Booking,
  BookingResponse,
  ChatResponse,
  ConversationDetailResponse,
  ConversationListResponse,
  DiagnosisResponse,
  HealthResponse,
  UploadResponse,
} from './types';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8010';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status; // 0 = network/CORS issue, warna HTTP status code
  }
}

// DRF errors do shapes mein aate hain: {detail: "..."} ya {field: ["msg"]}.
// Dono se ek user-friendly message nikaal lo — internal error kabhi UI pe nahi.
function extractErrorMessage(data: unknown, fallback: string): string {
  if (typeof data === 'object' && data !== null) {
    const record = data as Record<string, unknown>;
    if (typeof record.detail === 'string') return record.detail;
    for (const value of Object.values(record)) {
      if (typeof value === 'string') return value;
      if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    }
  }
  return fallback;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, options);
  } catch {
    // fetch sirf tab yahan pahunchta hai jab request hi na ja payi —
    // server band, ya CORS block. User ko simple baat batao.
    throw new ApiError(
      0,
      'Cannot reach the backend. Is the Django server running?',
    );
  }

  const contentType = response.headers.get('content-type') ?? '';
  const data: unknown = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      extractErrorMessage(data, `Request failed (HTTP ${response.status}).`),
    );
  }
  return data as T;
}

export function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/api/health/');
}

export function sendChat(
  message: string,
  conversationId?: number,
): Promise<ChatResponse> {
  return request<ChatResponse>('/api/chat/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      conversationId === undefined
        ? { message }
        : { message, conversation_id: conversationId },
    ),
  });
}

export function uploadMedia(
  file: File,
  conversationId?: number,
): Promise<UploadResponse> {
  // FormData ke saath Content-Type header KHUD mat set karna —
  // browser multipart boundary khud sambhalta hai.
  const formData = new FormData();
  formData.append('file', file);
  if (conversationId !== undefined) {
    formData.append('conversation_id', String(conversationId));
  }
  return request<UploadResponse>('/api/upload/', {
    method: 'POST',
    body: formData,
  });
}

export function getDiagnosis(conversationId: number): Promise<DiagnosisResponse> {
  return request<DiagnosisResponse>('/api/diagnosis/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation_id: conversationId }),
  });
}

export interface BookingPayload {
  diagnosis_id: number;
  customer_name: string;
  phone: string;
  preferred_date: string; // YYYY-MM-DD
}

export function createBooking(payload: BookingPayload): Promise<BookingResponse> {
  return request<BookingResponse>('/api/booking/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function getBooking(bookingId: number): Promise<{ booking: Booking }> {
  return request<{ booking: Booking }>(`/api/booking/${bookingId}/`);
}

export function getConversations(): Promise<ConversationListResponse> {
  return request<ConversationListResponse>('/api/conversations/');
}

export function getConversation(
  conversationId: number,
): Promise<ConversationDetailResponse> {
  return request<ConversationDetailResponse>(
    `/api/conversations/${conversationId}/`,
  );
}
