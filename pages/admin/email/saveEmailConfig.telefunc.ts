import { assertAdminAccess } from "../../../modules/auth/service";
import { activateEmailProvider, clearEmailLogs, deleteEmailConfig, saveEmailConfig, saveEmailPushSettings } from "../../../modules/email/service";
import { throwAbortError } from "../../../lib/throw-abort-error";

export async function onSaveEmailConfig(input: Record<string, unknown>) {
  try {
    assertAdminAccess();
    return await saveEmailConfig(input as any);
  } catch (error) {
    throwAbortError(error);
  }
}

export async function onDeleteEmailConfig(id: number) {
  try {
    assertAdminAccess();
    return await deleteEmailConfig(id);
  } catch (error) {
    throwAbortError(error);
  }
}

export async function onSaveEmailPushSettings(input: {
  customerSendOrderPaidEmail: boolean;
  customerSendDeliverySuccessEmail: boolean;
  customerSendDeliveryFailedEmail: boolean;
  adminSendOrderPaidEmail: boolean;
  adminSendDeliverySuccessEmail: boolean;
  adminSendDeliveryFailedEmail: boolean;
}) {
  try {
    assertAdminAccess();
    return await saveEmailPushSettings(input);
  } catch (error) {
    throwAbortError(error);
  }
}

export async function onActivateEmailProvider(id: number) {
  try {
    assertAdminAccess();
    return await activateEmailProvider(id);
  } catch (error) {
    throwAbortError(error);
  }
}

export async function onClearEmailLogs() {
  try {
    assertAdminAccess();
    return await clearEmailLogs();
  } catch (error) {
    throwAbortError(error);
  }
}
