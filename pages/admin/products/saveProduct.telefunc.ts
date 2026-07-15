import { assertAdminAccess } from "../../../modules/auth/service";
import { saveProduct } from "../../../modules/catalog/service";
import { throwAbortError } from "../../../lib/throw-abort-error";

export async function onSaveProduct(input: {
  id?: number;
  categoryId?: number | null;
  name: string;
  slug?: string;
  subtitle?: string;
  coverImage?: string;
  description?: string;
  price: number;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  deliveryType?: "CARD_AUTO" | "FIXED_CARD" | "MANUAL" | "EXPRESS";
  fixedDeliveryContent?: string;
  manualDeliveryHint?: string;
  minBuy: number;
  maxBuy: number;
  sort?: number;
  purchaseNote?: string;
}) {
  try {
    assertAdminAccess();
    return await saveProduct(input);
  } catch (error) {
    throwAbortError(error);
  }
}
