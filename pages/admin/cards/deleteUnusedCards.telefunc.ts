import { assertAdminAccess } from "../../../modules/auth/service";
import { deleteUnusedCards } from "../../../modules/inventory/service";
import { throwAbortError } from "../../../lib/throw-abort-error";

export async function onDeleteUnusedCards(input: { productId: number }) {
  try {
    assertAdminAccess();
    return await deleteUnusedCards(input);
  } catch (error) {
    throwAbortError(error);
  }
}
