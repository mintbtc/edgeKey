import { assertAdminAccess } from "../../../modules/auth/service";
import { saveS3Config } from "../../../modules/media/service";
import { throwAbortError } from "../../../lib/throw-abort-error";
import type { S3ConfigInput } from "../../../modules/media/types";

export async function onSaveS3Config(input: S3ConfigInput) {
  try {
    assertAdminAccess();
    return await saveS3Config(input);
  } catch (error) {
    throwAbortError(error);
  }
}
