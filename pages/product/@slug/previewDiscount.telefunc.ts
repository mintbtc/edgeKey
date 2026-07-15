import { previewDiscount } from "../../../modules/discount/service";
import { throwAbortError } from "../../../lib/throw-abort-error";

export async function onPreviewDiscount(code: string, productId: number, amount: number) {
  try {
    return await previewDiscount(code, productId, amount);
  } catch (error) {
    throwAbortError(error);
  }
}
