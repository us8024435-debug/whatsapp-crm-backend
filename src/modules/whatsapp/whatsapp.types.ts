/**
 * Type definitions for WhatsApp Cloud API webhook payloads.
 */

export interface WhatsAppWebhookPayload {
  object: string;
  entry: WhatsAppEntry[];
}

export interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

export interface WhatsAppChange {
  value: WhatsAppChangeValue;
  field: string;
}

export interface WhatsAppChangeValue {
  messaging_product: string;
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: WhatsAppContact[];
  messages?: WhatsAppMessage[];
  statuses?: WhatsAppStatus[];
}

export interface WhatsAppContact {
  profile: {
    name: string;
  };
  wa_id: string;
}

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: {
    body: string;
  };
  image?: WhatsAppMedia;
  audio?: WhatsAppMedia;
  video?: WhatsAppMedia;
  document?: WhatsAppMedia;
}

export interface WhatsAppMedia {
  id: string;
  mime_type: string;
  caption?: string;
}

export interface WhatsAppStatus {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
  errors?: Array<{
    code: number;
    title: string;
    message?: string;
    error_data?: { details: string };
  }>;
}

/** Normalized result after parsing an inbound message from a webhook payload */
export interface ParsedInboundMessage {
  providerMessageId: string;
  from: string;
  contactName: string | null;
  type: string;
  text: string | null;
  timestamp: string;
  rawPayload: any;
}

/** Normalized result after parsing a status update callback from a webhook payload */
export interface ParsedStatusUpdate {
  providerMessageId: string;
  status: string; // "sent" | "delivered" | "read" | "failed"
  recipientId: string;
  timestamp: string;
  rawPayload: any;
}
