import { assertAdminAccess } from "../../../modules/auth/service";
import { saveEmailTemplate, resetEmailTemplateToDefault } from "../../../modules/email/service";
import { throwAbortError } from "../../../lib/throw-abort-error";
import type { EmailScene } from "../../../modules/email/types";

export async function onSaveEmailTemplate(input: {
  scene: "TEST" | "ORDER_PAID" | "DELIVERY_SUCCESS" | "DELIVERY_FAILED";
  name: string;
  subject: string;
  content: string;
  isEnabled: boolean;
}) {
  try {
    assertAdminAccess();
    return await saveEmailTemplate(input);
  } catch (error) {
    throwAbortError(error);
  }
}

export async function onResetEmailTemplate(scene: EmailScene) {
  try {
    assertAdminAccess();
    return await resetEmailTemplateToDefault(scene);
  } catch (error) {
    throwAbortError(error);
  }
}
