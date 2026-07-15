import { assertAdminAccess } from "../../../modules/auth/service";
import { deleteMedia } from "../../../modules/media/service";
import { throwAbortError } from "../../../lib/throw-abort-error";

export async function onDeleteMedia(mediaId: number) {
  try {
    assertAdminAccess();
    return await deleteMedia(mediaId);
  } catch (error) {
    throwAbortError(error);
  }
}
