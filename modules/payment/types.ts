export type PaymentProvider = "BEPUSDT" | "EPAY" | "ALIPAY" | "ALIPAY_FACE" | "STRIPE" | "FREE_PAY" | "HASHPAY";

export interface PaymentMethodItem {
  provider: PaymentProvider;
  label: string;
  enabled: boolean;
  baseUrl?: string;
}

export interface PaymentConfigValue {
  provider: PaymentProvider;
  name: string;
  isEnabled: boolean;
  baseUrl: string;
  appId?: string;
  appSecret?: string;
  pid?: string;
  key?: string;
  notifyUrl?: string;
  returnUrl?: string;
  alipayAppId?: string;
  alipayPrivateKey?: string;
  alipayPublicKey?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  stripeCurrency?: string;
  hashpayMerchantId?: string;
  hashpayPrivateKey?: string;
  hashpayCurrency?: string;
}