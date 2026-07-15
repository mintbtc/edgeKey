import { assertAdminAccess } from "../../../modules/auth/service";
import { listMedia } from "../../../modules/media/service";
import { throwAbortError } from "../../../lib/throw-abort-error";
import type { MediaListFilters } from "../../../modules/media/types";

export async function onGetMediaList(filters: MediaListFilters) {
  try {
    assertAdminAccess();
    return await listMedia(filters);
  } catch (error) {
    throwAbortError(error);
  }
}
