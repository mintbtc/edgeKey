import type { S3ConfigInput } from "../../../modules/media/types";
import { assertAdminAccess } from "../../../modules/auth/service";
import { testS3Connection } from "../../../modules/media/service";
import { throwAbortError } from "../../../lib/throw-abort-error";

export async function onTestS3Connection(input?: S3ConfigInput) {
  try {
    assertAdminAccess();
    return await testS3Connection(input);
  } catch (error) {
    throwAbortError(error);
  }
}
