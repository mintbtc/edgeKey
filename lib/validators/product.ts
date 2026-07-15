import { badRequestError } from "../app-error";

export function validateProductInput(input: {
  name?: string;
  price?: number;
  minBuy?: number;
  maxBuy?: number;
  deliveryType?: string;
  fixedDeliveryContent?: string;
}) {
  const name = input.name?.trim() || "";
  if (!name) {
    throw badRequestError("商品名称不能为空", "PRODUCT_NAME_REQUIRED");
  }

  if (!Number.isFinite(input.price) || (input.price ?? -1) < 0) {
    throw badRequestError("商品价格不合法", "PRODUCT_PRICE_INVALID");
  }

  if (!Number.isFinite(input.minBuy) || (input.minBuy ?? 0) < 1) {
    throw badRequestError("最小购买数必须大于等于 1", "PRODUCT_MIN_BUY_INVALID");
  }

  if (!Number.isFinite(input.maxBuy) || (input.maxBuy ?? 0) < (input.minBuy ?? 1)) {
    throw badRequestError("最大购买数不能小于最小购买数", "PRODUCT_MAX_BUY_INVALID");
  }

  const deliveryType = input.deliveryType || "CARD_AUTO";
  if (!["CARD_AUTO", "FIXED_CARD", "MANUAL", "EXPRESS"].includes(deliveryType)) {
    throw badRequestError("发货方式不正确", "PRODUCT_DELIVERY_TYPE_INVALID");
  }

  const fixedDeliveryContent = input.fixedDeliveryContent?.trim() || "";
  if (deliveryType === "FIXED_CARD" && !fixedDeliveryContent) {
    throw badRequestError("固定内容自动发货必须填写发货内容", "PRODUCT_FIXED_CONTENT_REQUIRED");
  }

  return {
    name,
    deliveryType: deliveryType as "CARD_AUTO" | "FIXED_CARD" | "MANUAL" | "EXPRESS",
    fixedDeliveryContent,
  };
}
