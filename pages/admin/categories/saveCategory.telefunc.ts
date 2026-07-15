import { assertAdminAccess } from "../../../modules/auth/service";
import { saveCategory } from "../../../modules/catalog/service";
import { throwAbortError } from "../../../lib/throw-abort-error";

export async function onSaveCategory(input: {
  id?: number;
  name: string;
  slug?: string;
  description?: string;
  sort?: number;
}) {
  try {
    assertAdminAccess();
    return await saveCategory(input);
  } catch (error) {
    throwAbortError(error);
  }
}
