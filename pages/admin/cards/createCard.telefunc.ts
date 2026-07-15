import { assertAdminAccess } from "../../../modules/auth/service";
import { createCard } from "../../../modules/inventory/service";
import { throwAbortError } from "../../../lib/throw-abort-error";

export async function onCreateCard(input: { productId: number; content: string; batchNo?: string; force?: boolean }) {
  try {
    assertAdminAccess();
    return await createCard(input);
  } catch (error) {
    throwAbortError(error);
  }
}
