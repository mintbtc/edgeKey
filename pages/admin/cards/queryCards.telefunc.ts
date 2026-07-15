import { assertAdminAccess } from "../../../modules/auth/service";
import { getAdminCardsPaged } from "../../../modules/inventory/service";
import { throwAbortError } from "../../../lib/throw-abort-error";

export async function onQueryCards(params: {
  productId?: number;
  batchNo?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  pageSize: number;
}) {
  try {
    assertAdminAccess();
    return await getAdminCardsPaged(params);
  } catch (error) {
    throwAbortError(error);
  }
}
