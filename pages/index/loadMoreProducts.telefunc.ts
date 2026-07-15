import { getContext } from "telefunc";
import type { PrismaClient } from "../../generated/prisma/client";
import { listHomeProductsPaged } from "../../modules/catalog/queries";
import { throwAbortError } from "../../lib/throw-abort-error";

export async function onLoadMoreProducts(input: {
  skip: number;
  take?: number;
  categoryId?: number | null;
}) {
  try {
    const { prisma } = getContext() as { prisma: PrismaClient };
    const { take = 16, categoryId } = input;

    return await listHomeProductsPaged(prisma, {
      skip: input.skip,
      take,
      categoryId,
    });
  } catch (error) {
    throwAbortError(error);
  }
}
