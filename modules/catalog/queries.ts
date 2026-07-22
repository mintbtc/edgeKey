import type { PrismaClient } from "../../generated/prisma/client";
import { findProductRecordById, listAdminProductRecords, listCategoryRecords, listHomeCategoryRecords } from "./repository";
import type { AdminProductSummary, CategorySummary, ProductDeliveryTypeValue, ProductSummary } from "./types";

function getAvailableStock(item: { deliveryType: string; stockMode: string; physicalStock: number | null; _count: { cards: number } }) {
  // CARD_AUTO: 使用卡密数量作为库存
  if (item.deliveryType === "CARD_AUTO" && item.stockMode !== "UNLIMITED") {
    return item._count.cards;
  }

  // MANUAL/EXPRESS: 使用实物库存
  if ((item.deliveryType === "MANUAL" || item.deliveryType === "EXPRESS") && item.physicalStock != null) {
    return item.physicalStock;
  }

  return -1;
}

export async function listHomeProducts(prisma: PrismaClient): Promise<ProductSummary[]> {
  const records = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
    },
    include: {
      category: true,
      _count: {
        select: {
          cards: {
            where: { status: "UNUSED" },
          },
        },
      },
    },
    orderBy: [{ sort: "asc" }, { id: "desc" }],
  });

  return records.map((item) => mapProductSummary(item));
}

export async function listHomeProductsPaged(
  prisma: PrismaClient,
  params: { skip?: number; take?: number; categoryId?: number | null },
): Promise<{ items: ProductSummary[]; total: number }> {
  const { skip = 0, take = 16, categoryId } = params;

  const where = {
    status: "ACTIVE" as const,
    ...(categoryId ? { categoryId } : {}),
  };

  const [records, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: {
            cards: {
              where: { status: "UNUSED" },
            },
          },
        },
      },
      orderBy: [{ sort: "asc" }, { id: "desc" }],
      skip,
      take,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: records.map((item) => mapProductSummary(item)),
    total,
  };
}

function mapProductSummary(item: {
  id: number;
  categoryId: number | null;
  category: { name: string } | null;
  name: string;
  slug: string;
  coverImage: string | null;
  price: number;
  deliveryType: string;
  stockMode: string;
  physicalStock: number | null;
  _count: { cards: number };
}): ProductSummary {
  return {
    id: item.id,
    categoryId: item.categoryId,
    categoryName: item.category?.name ?? null,
    name: item.name,
    slug: item.slug,
    coverImage: item.coverImage,
    price: item.price,
    deliveryType: item.deliveryType as ProductDeliveryTypeValue,
    stockMode: item.stockMode as "FINITE" | "UNLIMITED",
    availableStock: getAvailableStock(item),
  };
}

export async function listHomeCategories(prisma: PrismaClient): Promise<CategorySummary[]> {
  const records = await listHomeCategoryRecords(prisma);

  return records.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description,
    sort: item.sort,
    status: item.status,
  }));
}

export async function listAdminCategories(prisma: PrismaClient): Promise<CategorySummary[]> {
  const records = await listCategoryRecords(prisma);

  return records.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description,
    sort: item.sort,
    status: item.status,
  }));
}

export async function listAdminProducts(prisma: PrismaClient): Promise<AdminProductSummary[]> {
  const records = await listAdminProductRecords(prisma);

  return records.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    subtitle: item.subtitle,
    coverImage: item.coverImage,
    price: item.price,
    status: item.status,
    deliveryType: item.deliveryType as ProductDeliveryTypeValue,
    minBuy: item.minBuy,
    maxBuy: item.maxBuy,
    sort: item.sort,
    categoryId: item.categoryId,
    categoryName: item.category?.name ?? null,
  }));
}

export async function getAdminProductDetail(prisma: PrismaClient, id: number) {
  const record = await findProductRecordById(prisma, id);
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    categoryId: record.categoryId,
    name: record.name,
    slug: record.slug,
    subtitle: record.subtitle,
    coverImage: record.coverImage,
    description: record.description,
    price: record.price,
    status: record.status,
    deliveryType: record.deliveryType as ProductDeliveryTypeValue,
    fixedDeliveryContent: record.fixedDeliveryContent,
    manualDeliveryHint: record.manualDeliveryHint,
    stockMode: record.stockMode as "FINITE" | "UNLIMITED",
    physicalStock: record.physicalStock,
    minBuy: record.minBuy,
    maxBuy: record.maxBuy,
    sort: record.sort,
    purchaseNote: record.purchaseNote,
  };
}

export async function getProductDetailBySlug(prisma: PrismaClient, slug: string) {
  const record = await prisma.product.findFirst({
    where: {
      slug,
      status: "ACTIVE",
    },
    include: {
      _count: {
        select: {
          cards: {
            where: { status: "UNUSED" },
          },
        },
      },
    },
  });

  if (!record) {
    return null;
  }

  return {
    id: record.id,
    categoryId: record.categoryId,
    name: record.name,
    slug: record.slug,
    subtitle: record.subtitle,
    coverImage: record.coverImage,
    description: record.description,
    price: record.price,
    status: record.status,
    minBuy: record.minBuy,
    maxBuy: record.maxBuy,
    sort: record.sort,
    purchaseNote: record.purchaseNote,
    deliveryType: record.deliveryType as ProductDeliveryTypeValue,
    manualDeliveryHint: record.manualDeliveryHint,
    stockMode: record.stockMode as "FINITE" | "UNLIMITED",
    physicalStock: record.physicalStock,
    availableStock: getAvailableStock(record),
  };
}
