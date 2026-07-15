export interface ProductFormState {
  id?: number;
  categoryId: string;
  name: string;
  slug: string;
  subtitle: string;
  coverImage: string;
  description: string;
  price: number;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  deliveryType: "CARD_AUTO" | "FIXED_CARD" | "MANUAL" | "EXPRESS";
  fixedDeliveryContent: string;
  manualDeliveryHint: string;
  minBuy: number;
  maxBuy: number;
  sort: number;
  purchaseNote: string;
}

export function createProductFormState(input?: Partial<ProductFormState>): ProductFormState {
  return {
    id: input?.id,
    categoryId: input?.categoryId ?? "",
    name: input?.name ?? "",
    slug: input?.slug ?? "",
    subtitle: input?.subtitle ?? "",
    coverImage: input?.coverImage ?? "",
    description: input?.description ?? "",
    price: input?.price ?? 0,
    status: input?.status ?? "DRAFT",
    deliveryType: input?.deliveryType ?? "CARD_AUTO",
    fixedDeliveryContent: input?.fixedDeliveryContent ?? "",
    manualDeliveryHint: input?.manualDeliveryHint ?? "",
    minBuy: input?.minBuy ?? 1,
    maxBuy: input?.maxBuy ?? 1,
    sort: input?.sort ?? 0,
    purchaseNote: input?.purchaseNote ?? "",
  };
}
