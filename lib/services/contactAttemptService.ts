import {
  findFollowUpById,
  findClientById,
  findContactChannelById,
  findContactResultById,
  createContactAttempt,
  findContactAttemptsByFollowUpId,
} from "@/lib/repositories/contactAttemptRepository";
import { validateCreateContactAttempt } from "@/lib/validators/contactAttemptValidator";
import { toDateOrFallback } from "@/lib/utils/date.utils";
import { toTrimmedStringOrFallback } from "@/lib/utils/string.utils";
import { toNumberOrFallback } from "@/lib/utils/number.utils";

type CreateContactAttemptInput = {
  client_id?: string;
  contact_channel_id?: number | string;
  contact_result_id?: number | string;
  attempt_datetime?: string;
  note_text?: string | null;
  next_action?: string | null;
  next_target_date?: string | null;
};

export async function getContactAttemptsByFollowUpIdService(
  followUpId: string,
) {
  const followUp = await findFollowUpById(followUpId);

  if (!followUp) {
    return null;
  }

  return findContactAttemptsByFollowUpId(followUpId);
}

export async function createContactAttemptService(
  followUpId: string,
  body: CreateContactAttemptInput,
) {
  const errors = validateCreateContactAttempt(body);

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const followUp = await findFollowUpById(followUpId);

  if (!followUp) {
    return { success: false, code: "follow_up_not_found" };
  }

  const clientId = String(body.client_id).trim();
  const contactChannelId = toNumberOrFallback(body.contact_channel_id, null);
  const contactResultId = toNumberOrFallback(body.contact_result_id, null);
  const attemptDateTime = toDateOrFallback(body.attempt_datetime, null);
  const nextTargetDate = toDateOrFallback(body.next_target_date, null);

  if (!clientId) {
    return {
      success: false,
      errors: [{ field: "client_id", error: "required" }],
    };
  }

  if (contactChannelId === null) {
    return {
      success: false,
      errors: [{ field: "contact_channel_id", error: "invalid" }],
    };
  }

  if (contactResultId === null) {
    return {
      success: false,
      errors: [{ field: "contact_result_id", error: "invalid" }],
    };
  }

  if (!attemptDateTime) {
    return {
      success: false,
      errors: [{ field: "attempt_datetime", error: "invalid" }],
    };
  }

  const client = await findClientById(clientId);
  if (!client) {
    return { success: false, code: "client_not_found" };
  }

  const channel = await findContactChannelById(contactChannelId);
  if (!channel) {
    return { success: false, code: "contact_channel_not_found" };
  }

  const result = await findContactResultById(contactResultId);
  if (!result) {
    return { success: false, code: "contact_result_not_found" };
  }

  const contactAttempt = await createContactAttempt({
    follow_up_id: followUpId,
    client_id: clientId,
    contact_channel_id: contactChannelId,
    contact_result_id: contactResultId,
    attempt_datetime: attemptDateTime,
    note_text: toTrimmedStringOrFallback(body.note_text, null),
    next_action: toTrimmedStringOrFallback(body.next_action, null),
    next_target_date: nextTargetDate,
  });

  return {
    success: true,
    contactAttempt,
  };
}
