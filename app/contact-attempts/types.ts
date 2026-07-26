export type ContactFlowStatus =
  | "PENDING"
  | "MESSAGE_SENT"
  | "WAITING_RESPONSE"
  | "OPTIONS_SENT"
  | "DATE_SELECTED"
  | "CONFIRMED"
  | "MANUAL_REQUIRED"
  | "NO_RESPONSE"
  | "REJECTED"
  | "CLOSED";

export type OperationalZone = {
  operational_zone_id: string;
  name: string;
  description?: string | null;
  reference_address?: string | null;
  color_label?: string | null;
  is_active?: boolean | null;
};

export type ContactFlowMessageMetadata = {
  mediaUrl?: string;
  mediaType?: string;
  filename?: string | null;
  caption?: string | null;
  [key: string]: unknown;
};

export type ContactFlowMessage = {
  message_id: string;
  contact_flow_id: string;
  direction: "OUTBOUND" | "INBOUND";
  message_text: string;
  message_type?: string | null;
  delivery_status?: string | null;
  metadata?: ContactFlowMessageMetadata | null;
  sent_at: string | null;
  received_at: string | null;
  created_at: string;
};

export type ContactFlowItem = {
  contact_flow_id: string;
  status: ContactFlowStatus;
  trigger_date: string;
  selected_date: string | null;
  first_message_sent_at: string | null;
  last_message_at: string | null;
  requires_manual_action: boolean;
  manual_reason: string | null;
  unread_count?: number;
  has_unread_messages?: boolean;
  client: {
    client_id: string;
    first_name: string;
    last_name_1: string;
    last_name_2: string | null;
    phone_primary: string;
    operational_zone_id?: string | null;
    operational_zone?: OperationalZone | null;
  };
  installation: {
    installation_id: string;
    description: string | null;
    operational_zone_id?: string | null;
    operational_zone?: OperationalZone | null;
  } | null;
  follow_up: {
    follow_up_id: string;
    target_date: string;
    scheduled_date: string | null;
    reason: string | null;
    priority: number;
    operational_zone_id?: string | null;
    operational_zone?: OperationalZone | null;
    follow_up_status: {
      follow_up_status_id: number;
      code: string;
      name: string;
      is_active: boolean;
    };
  };
  last_message: {
    message_id: string;
    direction: "OUTBOUND" | "INBOUND";
    message_text: string;
    message_type?: string | null;
    delivery_status?: string | null;
    metadata?: ContactFlowMessageMetadata | null;
    created_at: string;
    sent_at: string | null;
    received_at: string | null;
  } | null;
};

export type ApiResponse = {
  success: boolean;
  data: ContactFlowItem[];
};

export type MessagesApiResponse = {
  success: boolean;
  data: ContactFlowMessage[];
};

export type SendMessageApiResponse = {
  success: boolean;
  error?: string;
  details?: string;
  isMock?: boolean;
  data?: {
    messageId: string;
    waMessageId: string;
    contactFlowId: string;
    phoneNumber: string;
    sentAt: string | null;
  };
};

export type FilterType = "all" | "unread" | "waiting" | "confirmed" | "manual";

export type ViewMode = "list" | "grid";
