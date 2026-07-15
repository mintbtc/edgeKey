import { assertAdminAccess } from "../../../../modules/auth/service";
import { closeOrder } from "../../../../modules/order/service";
import { throwAbortError } from "../../../../lib/throw-abort-error";

export async function onCloseOrder(input: { orderId: number }) {
  try {
    assertAdminAccess();
    return await closeOrder(input.orderId);
  } catch (error) {
    throwAbortError(error);
  }
}
