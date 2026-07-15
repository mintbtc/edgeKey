import { assertAdminAccess } from "../../../modules/auth/service";
import { sendTestEmail } from "../../../modules/email/service";
import { throwAbortError } from "../../../lib/throw-abort-error";

export async function onSendTestEmail(input: {
  toEmail: string;
  customContent?: string;
  configId?: number;
}) {
  try {
    assertAdminAccess();
    return await sendTestEmail(input);
  } catch (error) {
    throwAbortError(error);
  }
}
