import { createPaymentForExistingOrder } from "../../../modules/order/service";
import { throwAbortError } from "../../../lib/throw-abort-error";

export async function onCreatePayment(input: { orderId: number }) {
  try {
    return await createPaymentForExistingOrder(input.orderId);
  } catch (error) {
    throwAbortError(error);
  }
}
