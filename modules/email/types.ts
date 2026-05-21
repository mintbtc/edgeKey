export type EmailChannel = "API" | "SMTP" | "CLOUDFLARE";

export type EmailApiProvider = string;

export type EmailScene = "TEST" | "ORDER_PAID" | "DELIVERY_SUCCESS" | "DELIVERY_FAILED";

export interface EmailPushFlags {
  customerSendOrderPaidEmail: boolean;
  customerSendDeliverySuccessEmail: boolean;
  customerSendDeliveryFailedEmail: boolean;
  adminSendOrderPaidEmail: boolean;
  adminSendDeliverySuccessEmail: boolean;
  adminSendDeliveryFailedEmail: boolean;
}

export interface EmailApiConfigValue extends EmailPushFlags {
  id?: number;
  name?: string;
  provider: "API";
  isEnabled: boolean;
  apiProvider: EmailApiProvider;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
  apiBaseUrl: string;
  apiKey?: string;
  timeoutMs?: number;
}

export interface EmailSmtpConfigValue extends EmailPushFlags {
  id?: number;
  name?: string;
  provider: "SMTP";
  isEnabled: boolean;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpAuthType?: "plain" | "login" | "cram-md5";
}

export interface EmailCloudflareConfigValue extends EmailPushFlags {
  id?: number;
  name?: string;
  provider: "CLOUDFLARE";
  isEnabled: boolean;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
  cloudflareBindingName?: string;
  cloudflareDestinationAddress?: string;
  cloudflareAllowedDestinationAddresses?: string[];
}

export type EmailConfigValue = EmailApiConfigValue | EmailSmtpConfigValue | EmailCloudflareConfigValue;

export interface EmailTemplateValue {
  scene: EmailScene;
  name: string;
  subject: string;
  content: string;
  isEnabled: boolean;
}

export interface EmailTemplateVariable {
  name: string;
  description: string;
}

export const EMAIL_TEMPLATE_VARIABLES: Record<EmailScene, EmailTemplateVariable[]> = {
  TEST: [
    { name: "siteName", description: "站点名称（来自站点设置）" },
    { name: "sentAt", description: "发送时间" },
    { name: "customContent", description: "自定义内容" },
  ],
  ORDER_PAID: [
    { name: "siteName", description: "站点名称（来自站点设置）" },
    { name: "orderNo", description: "订单号" },
    { name: "productName", description: "商品名称" },
    { name: "amount", description: "订单金额" },
    { name: "buyerNote", description: "买家备注" },
    { name: "queryUrl", description: "订单查询地址" },
    { name: "footerText", description: "页脚文本（来自站点设置）" },
  ],
  DELIVERY_SUCCESS: [
    { name: "siteName", description: "站点名称（来自站点设置）" },
    { name: "orderNo", description: "订单号" },
    { name: "productName", description: "商品名称" },
    { name: "quantity", description: "购买数量" },
    { name: "buyerNote", description: "买家备注" },
    { name: "deliveryItems", description: "发货内容" },
    { name: "queryUrl", description: "订单查询地址" },
    { name: "supportContact", description: "客服联系方式（来自站点设置）" },
  ],
  DELIVERY_FAILED: [
    { name: "siteName", description: "站点名称（来自站点设置）" },
    { name: "orderNo", description: "订单号" },
    { name: "productName", description: "商品名称" },
    { name: "buyerNote", description: "买家备注" },
    { name: "errorMessage", description: "失败原因" },
    { name: "queryUrl", description: "订单查询地址" },
    { name: "supportContact", description: "客服联系方式（来自站点设置）" },
  ],
};

export interface EmailLogItem {
  id: number;
  provider: EmailChannel;
  apiProvider?: EmailApiProvider | null;
  scene: EmailScene;
  status: "SUCCESS" | "FAILED";
  toEmail: string;
  subject: string;
  messageId?: string | null;
  error?: string | null;
  triggeredBy?: string | null;
  createdAt: string;
}

export interface EmailOverviewMetric {
  label: string;
  value: string;
}

export interface EmailSendInput {
  toEmail: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

export interface EmailSendResult {
  messageId?: string;
  raw?: unknown;
}

export interface EmailProviderAdapter {
  send(input: EmailSendInput): Promise<EmailSendResult>;
}
