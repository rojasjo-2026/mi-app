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

export type ContactFlowItem = {
  contact_flow_id: string;
  status: ContactFlowStatus;
  trigger_date: string;
  selected_date: string | null;
  first_message_sent_at: string | null;
  last_message_at: string | null;
  requires_manual_action: boolean;
  manual_reason: string | null;
  last_message: {
    direction: "OUTBOUND" | "INBOUND";
    message_text: string;
    created_at: string;
    sent_at: string | null;
    received_at: string | null;
  } | null;
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

export type AutomationSettings = {
  whatsapp_enabled: boolean;
  auto_contact_enabled: boolean;
  maintenance_contact_days_before: number;
  automatic_send_hour: number;
};

export type FollowUpAutomationContext = {
  follow_up_id: string;
  target_date: string | null;
  client: {
    whatsapp_opt_in?: boolean | null;
    phone_primary?: string | null;
  } | null;
};

export type ApiResponse = {
  success: boolean;
  data: ContactFlowItem[] | ContactFlowItem | null;
  message?: string;
};

export type MessagesApiResponse = {
  success: boolean;
  data: ContactFlowMessage[];
};

export type SendMessageApiResponse = {
  success: boolean;
  error?: string;
  details?: string;
};

export type SettingsApiResponse = {
  success: boolean;
  data: AutomationSettings | null;
  message?: string;
};

export type FollowUpApiResponse = {
  success: boolean;
  data: FollowUpAutomationContext | null;
  message?: string;
};

export type CreateContactFlowApiResponse = {
  success: boolean;
  data: ContactFlowItem | null;
  message?: string;
};
