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

export type AIExtractionResult =
  | {
      status: "success";
      provider: "gemini" | "groq";
      data: AIExtractionData;
    }
  | {
      status: "needs_review";
      provider: null;
      data: AIExtractionData;
      error: string;
    };
