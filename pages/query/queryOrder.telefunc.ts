import { getOrderForQuery } from "../../modules/order/service";
import { throwAbortError } from "../../lib/throw-abort-error";

export async function onQueryOrder(input: { orderNo: string; queryToken: string }) {
  try {
    return await getOrderForQuery(input.orderNo, input.queryToken);
  } catch (error) {
    throwAbortError(error);
  }
}
