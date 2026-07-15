import { getOrdersForLocalCache } from "../../modules/order/service";
import { throwAbortError } from "../../lib/throw-abort-error";

export async function onSyncLocalOrders(input: { orders: Array<{ orderNo: string; queryToken: string }> }) {
  try {
    return await getOrdersForLocalCache(input.orders);
  } catch (error) {
    throwAbortError(error);
  }
}
