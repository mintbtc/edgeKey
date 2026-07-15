import type { PrismaClient } from "../../generated/prisma/client";
import { getErrorMessage } from "../../lib/app-error";
import { logger } from "../../lib/logger";
import { notifyDeliveryFailed, notifyDeliverySuccess } from "../email/service";
import { badRequestError, conflictError, notFoundError } from "../../lib/app-error";
import { allocateCardsForOrder } from "../inventory/allocator";
import { updateOrderDeliveryState } from "../order/repository";

export async function deliverOrder(prisma: PrismaClient, orderNo: string) {
  const order = await prisma.order.findUnique({
    where: { orderNo },
    include: {
      product: true,
      deliveries: true,
    },
  });

  if (!order) {
    throw notFoundError("订单不存在", "ORDER_NOT_FOUND");
  }

  if (order.deliveryStatus === "DELIVERED") {
    return {
      success: true,
      items: order.deliveries.map((item) => item.contentSnapshot),
    };
  }

  if (order.paymentStatus !== "PAID") {
    throw conflictError("订单尚未支付", "ORDER_NOT_PAID");
  }

  try {
    if (order.product.deliveryType === "MANUAL" || order.product.deliveryType === "EXPRESS") {
      logger.info("manual_delivery_waiting", {
        event: "delivery.manual.waiting",
        orderNo: order.orderNo,
      });
      return {
        success: true,
        items: [],
        manual: true,
      };
    }

    let contents: string[];
    let deliveryType: "CARD" | "FIXED_CARD";

    if (order.product.deliveryType === "FIXED_CARD") {
      const fixedContent = order.product.fixedDeliveryContent?.trim();
      if (!fixedContent) {
        throw conflictError("固定发货内容未配置", "FIXED_DELIVERY_CONTENT_MISSING");
      }
      contents = [fixedContent];
      deliveryType = "FIXED_CARD";
    } else {
      const cards = await allocateCardsForOrder(prisma, order.id, order.productId, order.quantity);
      contents = cards.map((card) => card.content);
      deliveryType = "CARD";
    }

    await prisma.orderDelivery.create({
      data: {
        orderId: order.id,
        deliveryType,
        contentSnapshot: JSON.stringify(contents),
        status: "SUCCESS",
      },
    });

    await updateOrderDeliveryState(prisma, order.orderNo, {
      status: "DELIVERED",
      deliveryStatus: "DELIVERED",
      deliveredAt: new Date(),
    });

    if (order.contactType === "EMAIL" && order.contactValue) {
      try {
        await notifyDeliverySuccess({
          prisma,
          orderId: order.id,
          orderNo: order.orderNo,
          queryToken: order.queryToken,
          productName: order.productNameSnapshot,
          quantity: order.quantity,
          items: contents,
          toEmail: order.contactValue,
          contactEmail: order.contactValue,
          buyerNote: order.buyerNote,
        });
      } catch (error) {
        logger.error(error instanceof Error ? error : String(error), {
          event: "email.delivery_success.failed",
          orderNo: order.orderNo,
        });
      }
    }

    return {
      success: true,
      items: contents,
    };
  } catch (error) {
    const failedDeliveryType = order.product.deliveryType === "FIXED_CARD" ? "FIXED_CARD" : "CARD";
    await prisma.orderDelivery.create({
      data: {
        orderId: order.id,
        deliveryType: failedDeliveryType,
        contentSnapshot: error instanceof Error ? error.message : "delivery failed",
        status: "FAILED",
      },
    });

    await updateOrderDeliveryState(prisma, order.orderNo, {
      status: "FAILED",
      deliveryStatus: "FAILED",
      deliveredAt: null,
    });

    if (order.contactType === "EMAIL" && order.contactValue) {
      try {
        await notifyDeliveryFailed({
          prisma,
          orderId: order.id,
          orderNo: order.orderNo,
          queryToken: order.queryToken,
          productName: order.productNameSnapshot,
          toEmail: order.contactValue,
          contactEmail: order.contactValue,
          errorMessage: getErrorMessage(error, "delivery failed"),
          buyerNote: order.buyerNote,
        });
      } catch (emailError) {
        logger.error(emailError instanceof Error ? emailError : String(emailError), {
          event: "email.delivery_failed.failed",
          orderNo: order.orderNo,
        });
      }
    }

    throw error;
  }
}

export async function adminDeliverOrder(prisma: PrismaClient, orderId: number, input?: { content?: string }) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: true },
  });

  if (!order) {
    throw notFoundError("订单不存在", "ORDER_NOT_FOUND");
  }

  if (order.paymentStatus !== "PAID") {
    throw conflictError("订单未支付，无法发货", "ORDER_NOT_PAID");
  }

  if (order.deliveryStatus === "DELIVERED") {
    throw conflictError("订单已发货，无需重复发货", "ORDER_ALREADY_DELIVERED");
  }

  if (order.product.deliveryType !== "MANUAL" && order.product.deliveryType !== "EXPRESS") {
    return deliverOrder(prisma, order.orderNo);
  }

  const content = input?.content?.trim();
  if (!content) {
    throw badRequestError("手动发货内容不能为空", "MANUAL_DELIVERY_CONTENT_REQUIRED");
  }

  await prisma.orderDelivery.create({
    data: {
      orderId: order.id,
      deliveryType: order.product.deliveryType === "EXPRESS" ? "EXPRESS" : "MANUAL",
      contentSnapshot: content,
      status: "SUCCESS",
    },
  });

  await updateOrderDeliveryState(prisma, order.orderNo, {
    status: "DELIVERED",
    deliveryStatus: "DELIVERED",
    deliveredAt: new Date(),
  });

  if (order.contactType === "EMAIL" && order.contactValue) {
    try {
      await notifyDeliverySuccess({
        prisma,
        orderId: order.id,
        orderNo: order.orderNo,
        queryToken: order.queryToken,
        productName: order.productNameSnapshot,
        quantity: order.quantity,
        items: [content],
        toEmail: order.contactValue,
        contactEmail: order.contactValue,
        buyerNote: order.buyerNote,
      });
    } catch (error) {
      logger.error(error instanceof Error ? error : String(error), {
        event: "email.manual_delivery_success.failed",
        orderNo: order.orderNo,
      });
    }
  }

  return {
    success: true,
    items: [content],
    manual: true,
  };
}

export async function redeliverOrder(prisma: PrismaClient, orderId: number) {
  return adminDeliverOrder(prisma, orderId);
}
