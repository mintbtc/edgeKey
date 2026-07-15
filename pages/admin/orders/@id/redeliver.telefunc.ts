import { assertAdminAccess } from "../../../../modules/auth/service";
import { adminDeliverOrder } from "../../../../modules/delivery/service";
import { getContext } from "telefunc";
import type { PrismaClient } from "../../../../generated/prisma/client";
import { throwAbortError } from "../../../../lib/throw-abort-error";

export async function onRedeliver(input: { orderId: number; content?: string }) {
  try {
    assertAdminAccess();
    const { prisma } = getContext<{ prisma: PrismaClient }>();
    return await adminDeliverOrder(prisma, input.orderId, { content: input.content });
  } catch (error) {
    throwAbortError(error);
  }
}
