import { assertAdminAccess } from "../../../modules/auth/service";
import { deleteCategory } from "../../../modules/catalog/service";
import { throwAbortError } from "../../../lib/throw-abort-error";

export async function onDeleteCategory(input: { id: number }) {
  try {
    assertAdminAccess();
    return await deleteCategory(input);
  } catch (error) {
    throwAbortError(error);
  }
}
