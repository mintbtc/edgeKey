import { assertAdminAccess } from "../../../modules/auth/service";
import { listDiscountCodes, createDiscountCode, updateDiscountCode, deleteDiscountCode } from "../../../modules/discount/service";
import type { PrismaClient } from "../../../generated/prisma/client";
import { getContext } from "telefunc";
import { throwAbortError } from "../../../lib/throw-abort-error";

function getAdminPrisma(): PrismaClient {
  assertAdminAccess();
  return getContext<{ prisma: PrismaClient }>().prisma;
}

export async function onQueryDiscountCodes(input: {
  page?: number;
  pageSize?: number;
}) {
  try {
    const prisma = getAdminPrisma();
    const page = input.page || 1;
    const pageSize = input.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      prisma.discountCode.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.discountCode.count(),
    ]);

    return { items, total };
  } catch (error) {
    throwAbortError(error);
  }
}

export async function onCreateDiscountCode(input: {
  code: string;
  type: "FIXED" | "PERCENT";
  value: number;
  minAmount?: number;
  maxUses?: number;
  productIds?: string;
  expiresAt?: string;
}) {
  try {
    const prisma = getAdminPrisma();
    return await createDiscountCode({
      ...input,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    }, prisma);
  } catch (error) {
    throwAbortError(error);
  }
}

export async function onUpdateDiscountCode(id: number, input: {
  code?: string;
  type?: "FIXED" | "PERCENT";
  value?: number;
  minAmount?: number | null;
  maxUses?: number | null;
  productIds?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
}) {
  try {
    const prisma = getAdminPrisma();
    return await updateDiscountCode(id, {
      ...input,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : input.expiresAt === null ? null : undefined,
    }, prisma);
  } catch (error) {
    throwAbortError(error);
  }
}

export async function onDeleteDiscountCode(id: number) {
  try {
    const prisma = getAdminPrisma();
    return await deleteDiscountCode(id, prisma);
  } catch (error) {
    throwAbortError(error);
  }
}
