// Backend API ke response shapes — chatbot/serializers.py ka frontend mirror.
// Sirf types hain (runtime code nahi), isliye ye file kabhi bundle mein weight nahi daalti.

export type MessageRole = 'user' | 'assistant';
export type GeneratedBy = 'user' | 'rule_engine' | 'gemini';

export interface ChatMessage {
  id: number;
  role: MessageRole;
  content: string;
  generated_by: GeneratedBy;
  created_at: string;
}

// UI-only extension — optimistic sending ke liye. Server response mein ye
// fields kabhi nahi aate, sirf browser ke andar use hote hain.
// media: upload bubble ke liye — pehle local object URL (preview), upload
// ke baad server ka media record (asli file URL).
export interface UiMessage extends ChatMessage {
  pending?: boolean;
  failed?: boolean;
  media?: MediaUpload;
}

// POST /api/chat/ ka response
export interface ChatResponse {
  conversation_id: number;
  conversation_title: string;
  user_message: ChatMessage;
  reply: ChatMessage;
}

export type MediaType = 'image' | 'audio' | 'video';

export interface MediaUpload {
  id: number;
  file: string;
  media_type: MediaType;
  original_name: string;
  size_bytes: number;
  mime_type: string;
  analysis_status: 'pending' | 'analyzed' | 'skipped';
  created_at: string;
}

// POST /api/upload/ ka response
export interface UploadResponse {
  conversation_id: number;
  conversation_title: string;
  media: MediaUpload;
}

export type Confidence = 'low' | 'medium' | 'high';

export interface Diagnosis {
  id: number;
  likely_issue: string;
  reasoning: string;
  confidence: Confidence;
  can_drive: boolean;
  next_step: string;
  recommended_service: string;
  generated_by: 'rule_engine' | 'gemini';
  summary: Record<string, unknown>;
  created_at: string;
}

// POST /api/diagnosis/ ka response
export interface DiagnosisResponse {
  conversation_id: number;
  conversation_status: string;
  diagnosis: Diagnosis;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  id: number;
  booking_ref: string;
  diagnosis_id: number;
  conversation_id: number;
  likely_issue: string;
  customer_name: string;
  phone: string;
  preferred_date: string;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
}

// POST /api/booking/ ka response
export interface BookingResponse {
  conversation_id: number;
  conversation_status: string;
  booking: Booking;
}

// GET /api/health/
export interface HealthResponse {
  status: string;
  service: string;
}

export type ConversationStatus = 'active' | 'diagnosed' | 'booked' | 'closed';

// GET /api/conversations/ — sidebar ke liye halka summary (messages nahi)
export interface ConversationSummary {
  id: number;
  title: string;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_preview: string | null;
}

export interface ConversationListResponse {
  conversations: ConversationSummary[];
}

// GET /api/conversations/<id>/ — purani conversation restore karne ke liye
// poori history: messages + media + latest diagnosis + booking (agar hui ho).
export interface ConversationDetailResponse {
  conversation: ConversationSummary;
  messages: ChatMessage[];
  media: MediaUpload[];
  diagnosis: Diagnosis | null;
  booking: Booking | null;
}
