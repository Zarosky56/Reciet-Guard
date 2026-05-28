export type ReceiptStatus = "active" | "returned" | "kept" | "expired";

export type Urgency = "green" | "yellow" | "red";

export interface Receipt {
  id: string;
  user_id: string;
  store_name: string | null;
  item_name: string | null;
  price: number | null;
  currency: string | null;
  purchase_date: string | null;
  return_deadline: string | null;
  warranty_deadline: string | null;
  raw_email_text?: string | null;
  ai_confidence: number | null;
  status: ReceiptStatus;
  notification_sent_7d: boolean;
  notification_sent_3d: boolean;
  notification_sent_1d: boolean;
  product_brand?: string | null;
  product_model?: string | null;
  serial_number?: string | null;
  category?: string | null;
  warranty_period_months?: number | null;
  extraction_provider?: AIProvider | "manual" | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReceiptWithUrgency extends Receipt {
  days_remaining: number | null;
  urgency: Urgency;
}

export interface AIExtractionData {
  store_name: string | null;
  item_name: string | null;
  price: number | null;
  currency: string;
  purchase_date: string | null;
  return_deadline: string | null;
  warranty_deadline?: string | null;
  confidence: number;
}

export type AIProvider = "document_ai" | "vertex_ai" | "gemini" | "groq";

export type AIExtractionResult =
  | {
      status: "success";
      provider: AIProvider;
      data: AIExtractionData;
    }
  | {
      status: "needs_review";
      provider: null;
      data: AIExtractionData;
      error: string;
    };


export type AttachmentKind =
  | "receipt"
  | "warranty_card"
  | "product_photo"
  | "invoice"
  | "other";

export type AttachmentSource =
  | "upload"
  | "camera"
  | "email_attachment"
  | "generated";

export interface Attachment {
  id: string;
  receipt_id: string;
  user_id: string;
  storage_path: string;
  original_filename: string | null;
  mime_type: string;
  size_bytes: number;
  kind: AttachmentKind;
  source: AttachmentSource;
  is_primary: boolean;
  created_at: string;
}

export interface AttachmentWithUrl extends Attachment {
  signed_url: string | null;
}
