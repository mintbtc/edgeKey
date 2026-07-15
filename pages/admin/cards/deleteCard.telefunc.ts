import { assertAdminAccess } from "../../../modules/auth/service";
import { deleteCard } from "../../../modules/inventory/service";
import { throwAbortError } from "../../../lib/throw-abort-error";

export async function onDeleteCard(input: { id: number }) {
  try {
    assertAdminAccess();
    return await deleteCard(input);
  } catch (error) {
    throwAbortError(error);
  }
}
