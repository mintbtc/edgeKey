import { assertAdminAccess } from "../../../modules/auth/service";
import { importCards } from "../../../modules/inventory/service";
import { throwAbortError } from "../../../lib/throw-abort-error";

export async function onImportCards(input: { productId: number; lines: string; batchNo?: string; skipInputDedup?: boolean; force?: boolean }) {
  try {
    assertAdminAccess();
    return await importCards(input);
  } catch (error) {
    throwAbortError(error);
  }
}
