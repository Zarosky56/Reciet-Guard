import type { ReceiptStatus } from "@/types/receipt";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          forwarding_address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          forwarding_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          forwarding_address?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      receipts: {
        Row: {
          id: string;
          user_id: string;
          store_name: string | null;
          item_name: string | null;
          price: number | null;
          currency: string | null;
          purchase_date: string | null;
          return_deadline: string | null;
          warranty_deadline: string | null;
          raw_email_text: string | null;
          ai_confidence: number | null;
          status: ReceiptStatus;
          notification_sent_7d: boolean;
          notification_sent_3d: boolean;
          notification_sent_1d: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          store_name?: string | null;
          item_name?: string | null;
          price?: number | null;
          currency?: string | null;
          purchase_date?: string | null;
          return_deadline?: string | null;
          warranty_deadline?: string | null;
          raw_email_text?: string | null;
          ai_confidence?: number | null;
          status?: ReceiptStatus;
          notification_sent_7d?: boolean;
          notification_sent_3d?: boolean;
          notification_sent_1d?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          store_name?: string | null;
          item_name?: string | null;
          price?: number | null;
          currency?: string | null;
          purchase_date?: string | null;
          return_deadline?: string | null;
          warranty_deadline?: string | null;
          raw_email_text?: string | null;
          ai_confidence?: number | null;
          status?: ReceiptStatus;
          notification_sent_7d?: boolean;
          notification_sent_3d?: boolean;
          notification_sent_1d?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      email_logs: {
        Row: {
          id: string;
          user_id: string | null;
          receipt_id: string | null;
          gmail_message_id: string | null;
          from_address: string | null;
          subject: string | null;
          received_at: string;
          processing_status: "pending" | "success" | "failed" | "needs_review";
          error_message: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          receipt_id?: string | null;
          gmail_message_id?: string | null;
          from_address?: string | null;
          subject?: string | null;
          received_at?: string;
          processing_status?:
            | "pending"
            | "success"
            | "failed"
            | "needs_review";
          error_message?: string | null;
        };
        Update: {
          receipt_id?: string | null;
          processing_status?:
            | "pending"
            | "success"
            | "failed"
            | "needs_review";
          error_message?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
