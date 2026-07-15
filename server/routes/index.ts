import type { Hono } from "hono";
import { registerHealthRoutes } from "./health";
import { registerBepusdtRoutes } from "./payment-bepusdt";
import { registerEpayRoutes } from "./payment-epay";
import { registerAlipayRoutes } from "./payment-alipay";
import { registerAlipayFaceRoutes } from "./payment-alipay-face";
import { registerStripeRoutes } from "./payment-stripe";
import { registerHashpayRoutes } from "./payment-hashpay";
import { registerRobotsRoutes } from "./robots";
import { registerSitemapRoutes } from "./sitemap";
import { registerMediaRoutes } from "./media";
import { registerAuthConfigRoutes } from "./auth-config";
import { registerTurnstileRoutes } from "./turnstile";

// 集中注册所有 `/api/*` 路由，避免入口文件散落多个 register 调用。
export function registerApiRoutes(app: Hono) {
  registerHealthRoutes(app);
  registerBepusdtRoutes(app);
  registerEpayRoutes(app);
  registerAlipayRoutes(app);
  registerAlipayFaceRoutes(app);
  registerStripeRoutes(app);
  registerHashpayRoutes(app);
  registerRobotsRoutes(app);
  registerSitemapRoutes(app);
  registerMediaRoutes(app);
  registerAuthConfigRoutes(app);
  registerTurnstileRoutes(app);
}

