import { queryAlipayPayment } from "../../../modules/payment/service";
import { throwAbortError } from "../../../lib/throw-abort-error";

export async function onQueryAlipayPayment(input: { orderNo: string }) {
  try {
    return await queryAlipayPayment(input.orderNo);
  } catch (error) {
    throwAbortError(error);
  }
}
