import { assertAdminAccess, createAdminTwoFactorSetup, disableAdminTwoFactor, enableAdminTwoFactor } from "../../../modules/auth/service";
import { throwAbortError } from "../../../lib/throw-abort-error";

export async function onCreateTwoFactorSetup() {
  try {
    assertAdminAccess();
    return await createAdminTwoFactorSetup();
  } catch (error) {
    throwAbortError(error);
  }
}

export async function onEnableTwoFactor(input: { secret: string; code: string }) {
  try {
    assertAdminAccess();
    return await enableAdminTwoFactor(input);
  } catch (error) {
    throwAbortError(error);
  }
}

export async function onDisableTwoFactor(input: { currentPassword: string; code?: string }) {
  try {
    assertAdminAccess();
    return await disableAdminTwoFactor(input);
  } catch (error) {
    throwAbortError(error);
  }
}
