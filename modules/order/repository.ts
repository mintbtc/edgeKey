import type { PrismaClient } from "../../generated/prisma/client";
import type { PaymentProvider } from "../payment/types";

export function findOrderRecord(prisma: PrismaClient, orderNo: string) {
  return prisma.order.findUnique({
    where: { orderNo },
  });
}

export function findOrderWithProduct(prisma: PrismaClient, orderNo: string) {
  return prisma.order.findUnique({
    where: { orderNo },
    include: {
      product: true,
      deliveries: true,
      discountCode: true,
    },
  });
}

export function listOrderRecords(prisma: PrismaClient) {
  return prisma.order.findMany({
    orderBy: [{ id: "desc" }],
    include: {
      product: true,
      deliveries: true,
      discountCode: true,
    },
  });
}

export function findOrderById(prisma: PrismaClient, id: number) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      product: true,
      deliveries: true,
      cards: true,
      paymentLogs: true,
      discountCode: true,
    },
  });
}

export function createOrderRecord(
  prisma: PrismaClient,
  input: {
    orderNo: string;
    queryToken: string;
    productId: number;
    productNameSnapshot: string;
    unitPrice: number;
    quantity: number;
    amount: number;
    contactType: "EMAIL" | "QQ" | "TELEGRAM" | "OTHER";
    contactValue?: string | null;
    buyerNote?: string | null;
    receiverInfo?: string | null;
    paymentProvider: PaymentProvider;
    paymentChannel?: string | null;
    discountCodeId?: number | null;
    discountCodeStr?: string | null;
    originalAmount?: number | null;
    discountAmount?: number | null;
  },
) {
  return prisma.order.create({
    data: {
      orderNo: input.orderNo,
      queryToken: input.queryToken,
      productId: input.productId,
      productNameSnapshot: input.productNameSnapshot,
      unitPrice: input.unitPrice,
      quantity: input.quantity,
      amount: input.amount,
      contactType: input.contactType,
      contactValue: input.contactValue ?? null,
      buyerNote: input.buyerNote ?? null,
      receiverInfo: input.receiverInfo ?? null,
      paymentProvider: input.paymentProvider,
      paymentChannel: input.paymentChannel ?? null,
      discountCodeId: input.discountCodeId ?? null,
      discountCodeStr: input.discountCodeStr ?? null,
      originalAmount: input.originalAmount ?? null,
      discountAmount: input.discountAmount ?? null,
    },
  });
}

export async function updateOrderPayment(prisma: PrismaClient, orderNo: string, input: {
  paymentOrderNo?: string | null;
  status: "PENDING" | "PAID" | "DELIVERED" | "CLOSED" | "FAILED";
  paymentStatus: "UNPAID" | "PAID" | "FAILED";
  paidAt?: Date | null;
}) {
  const result = await prisma.order.updateMany({
    where: { 
      orderNo,
      paymentStatus: "UNPAID" 
    },
    data: {
      paymentOrderNo: input.paymentOrderNo ?? null,
      status: input.status,
      paymentStatus: input.paymentStatus,
      paidAt: input.paidAt ?? null,
    },
  });
  return result.count > 0;
}

export function updateOrderDeliveryState(
  prisma: PrismaClient,
  orderNo: string,
  input: {
    status: "PENDING" | "PAID" | "DELIVERED" | "CLOSED" | "FAILED";
    deliveryStatus: "NOT_DELIVERED" | "DELIVERED" | "FAILED";
    deliveredAt?: Date | null;
  },
) {
  return prisma.order.update({
    where: { orderNo },
    data: {
      status: input.status,
      deliveryStatus: input.deliveryStatus,
      deliveredAt: input.deliveredAt ?? null,
    },
  });
}

export function closeOrderRecord(prisma: PrismaClient, id: number) {
  return prisma.order.update({
    where: { id },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
    },
  });
}
