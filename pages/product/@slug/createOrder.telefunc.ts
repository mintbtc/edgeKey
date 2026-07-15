import { createOrder } from "../../../modules/order/service";
import { throwAbortError } from "../../../lib/throw-abort-error";
import type { PaymentProvider } from "../../../modules/payment/types";

export async function onCreateOrder(input: {
  productId: number;
  quantity: number;
  paymentProvider: PaymentProvider;
  paymentChannel?: string;
  contactType: "EMAIL";
  contactValue: string;
  buyerNote?: string;
  receiverInfo?: string;
  discountCode?: string;
}) {
  try {
    return await createOrder(input);
  } catch (error) {
    throwAbortError(error);
  }
}
