import { assertAdminAccess } from "../../../modules/auth/service";
import { getS3Config } from "../../../modules/media/service";
import { throwAbortError } from "../../../lib/throw-abort-error";

export async function onGetS3Config() {
  try {
    assertAdminAccess();
    return await getS3Config();
  } catch (error) {
    throwAbortError(error);
  }
}
