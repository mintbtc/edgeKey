import type { Hono } from "hono";
import type { PrismaClient } from "../../generated/prisma/client";
import { handlePaymentNotify } from "../../modules/payment/service";
import { logger } from "../../lib/logger";

export function registerHashpayRoutes(app: Hono) {
  app.post("/api/payments/hashpay/notify", async (c) => {
    let payload: Record<string, string> = {};
    try {
      const rawBody = await c.req.text();
      const merchantId = c.req.header("X-HashPay-Merchant") ?? "";
      const timestamp = c.req.header("X-HashPay-Timestamp") ?? "";
      const encryption = c.req.header("X-HashPay-Encryption") ?? "";

      payload = {
        __raw_body: rawBody,
        __hashpay_merchant: merchantId,
        __hashpay_timestamp: timestamp,
        __hashpay_encryption: encryption,
      };

      const universalContext = (c as any).get("universalContext") as { prisma: PrismaClient };
      if (!universalContext?.prisma) {
        logger.error("Missing prisma for hashpay notify", {
          event: "payment.notify.context_missing",
          provider: "HASHPAY",
          source: "notify",
        });
        return c.text("fail", 500);
      }

      const result = await handlePaymentNotify("HASHPAY", payload, universalContext.prisma, "notify");
      return c.text(result.ok ? "success" : "fail");
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), {
        event: "payment.notify.route_exception",
        provider: "HASHPAY",
        source: "notify",
      });
      return c.text("fail", 400);
    }
  });
}
