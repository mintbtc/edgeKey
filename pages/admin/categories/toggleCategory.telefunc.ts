import { assertAdminAccess } from "../../../modules/auth/service";
import { toggleCategoryStatus } from "../../../modules/catalog/service";
import { throwAbortError } from "../../../lib/throw-abort-error";

export async function onToggleCategory(input: { id: number; status: "ACTIVE" | "DISABLED" }) {
  try {
    assertAdminAccess();
    return await toggleCategoryStatus(input);
  } catch (error) {
    throwAbortError(error);
  }
}
