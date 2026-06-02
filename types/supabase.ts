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
          role: "user" | "admin";
          default_currency: string;
          onboarding_completed: boolean;
          intro_to_app_enabled: boolean;
          email_notifications_enabled: boolean;
          push_notifications_enabled: boolean;
          reminder_thresholds: number[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          forwarding_address?: string | null;
          role?: "user" | "admin";
          default_currency?: string;
          onboarding_completed?: boolean;
          intro_to_app_enabled?: boolean;
          email_notifications_enabled?: boolean;
          push_notifications_enabled?: boolean;
          reminder_thresholds?: number[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          forwarding_address?: string | null;
          role?: "user" | "admin";
          default_currency?: string;
          onboarding_completed?: boolean;
          intro_to_app_enabled?: boolean;
          email_notifications_enabled?: boolean;
          push_notifications_enabled?: boolean;
          reminder_thresholds?: number[];
          updated_at?: string;
        };
        Relationships: [];
      };
      user_gmail_connections: {
        Row: {
          id: string;
          user_id: string;
          gmail_email: string | null;
          access_token: string | null;
          refresh_token: string | null;
          expires_at: string | null;
          scope: string | null;
          status: "connected" | "disconnected" | "needs_reconnect";
          needs_reconnect: boolean;
          connected_at: string;
          updated_at: string;
          last_sync_at: string | null;
          sync_preferences: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          gmail_email?: string | null;
          access_token?: string | null;
          refresh_token?: string | null;
          expires_at?: string | null;
          scope?: string | null;
          status?: "connected" | "disconnected" | "needs_reconnect";
          needs_reconnect?: boolean;
          connected_at?: string;
          updated_at?: string;
          last_sync_at?: string | null;
          sync_preferences?: Json | null;
        };
        Update: {
          gmail_email?: string | null;
          access_token?: string | null;
          refresh_token?: string | null;
          expires_at?: string | null;
          scope?: string | null;
          status?: "connected" | "disconnected" | "needs_reconnect";
          needs_reconnect?: boolean;
          connected_at?: string;
          updated_at?: string;
          last_sync_at?: string | null;
          sync_preferences?: Json | null;
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
      attachments: {
        Row: {
          id: string;
          receipt_id: string;
          user_id: string;
          storage_path: string;
          original_filename: string | null;
          mime_type: string;
          size_bytes: number;
          kind: "receipt" | "warranty_card" | "product_photo" | "invoice" | "other";
          source: "upload" | "camera" | "email_attachment" | "generated";
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          receipt_id: string;
          user_id: string;
          storage_path: string;
          original_filename?: string | null;
          mime_type: string;
          size_bytes: number;
          kind?: "receipt" | "warranty_card" | "product_photo" | "invoice" | "other";
          source?: "upload" | "camera" | "email_attachment" | "generated";
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          original_filename?: string | null;
          kind?: "receipt" | "warranty_card" | "product_photo" | "invoice" | "other";
          source?: "upload" | "camera" | "email_attachment" | "generated";
          is_primary?: boolean;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          target_type: string | null;
          target_id: string | null;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          target_type?: string | null;
          target_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          metadata?: Json;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          enabled: boolean;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
          enabled?: boolean;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          user_agent?: string | null;
          enabled?: boolean;
          last_error?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_events: {
        Row: {
          id: string;
          user_id: string;
          receipt_id: string | null;
          channel: "email" | "push" | "in_app";
          type:
            | "return_deadline"
            | "warranty_deadline"
            | "gmail_import"
            | "extraction_review";
          threshold_days: number | null;
          dedupe_key: string;
          title: string;
          body: string;
          delivery_status: "pending" | "sent" | "skipped" | "failed";
          error_message: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          receipt_id?: string | null;
          channel: "email" | "push" | "in_app";
          type:
            | "return_deadline"
            | "warranty_deadline"
            | "gmail_import"
            | "extraction_review";
          threshold_days?: number | null;
          dedupe_key: string;
          title: string;
          body: string;
          delivery_status?: "pending" | "sent" | "skipped" | "failed";
          error_message?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          delivery_status?: "pending" | "sent" | "skipped" | "failed";
          error_message?: string | null;
          metadata?: Json;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: { uid: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
