import { assertAdminAccess } from "../../../modules/auth/service";
import { deleteProduct } from "../../../modules/catalog/service";
import { throwAbortError } from "../../../lib/throw-abort-error";

export async function onDeleteProduct(input: { id: number }) {
  try {
    assertAdminAccess();
    return await deleteProduct(input);
  } catch (error) {
    throwAbortError(error);
  }
}
