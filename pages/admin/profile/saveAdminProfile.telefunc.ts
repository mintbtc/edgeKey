import { assertAdminAccess, updateAdminProfile } from "../../../modules/auth/service";
import { throwAbortError } from "../../../lib/throw-abort-error";

export async function onSaveAdminProfile(input: {
  nickname?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  try {
    assertAdminAccess();
    return await updateAdminProfile(input);
  } catch (error) {
    throwAbortError(error);
  }
}
