import { badRequestError, externalServiceError } from "../../lib/app-error";
import { httpPost } from "../../lib/http-client";
import type { EmailApiConfigValue, EmailProviderAdapter, EmailSendInput, EmailSmtpConfigValue } from "./types";

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function buildBrevoPayload(config: EmailApiConfigValue, input: EmailSendInput) {
  return {
    sender: {
      email: config.fromEmail,
      name: config.fromName || "API Mail",
    },
    to: [{ email: input.toEmail }],
    replyTo: input.replyTo || config.replyTo ? { email: input.replyTo || config.replyTo } : undefined,
    subject: input.subject,
    htmlContent: input.html || `<html><body><pre>${input.text.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char] || char))}</pre></body></html>`,
    textContent: input.text,
  };
}

function buildResendPayload(config: EmailApiConfigValue, input: EmailSendInput) {
  const from = config.fromName
    ? `${config.fromName} <${config.fromEmail}>`
    : config.fromEmail;

  return {
    from,
    to: [input.toEmail],
    reply_to: input.replyTo || config.replyTo || undefined,
    subject: input.subject,
    html: input.html || `<html><body><pre>${input.text.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char] || char))}</pre></body></html>`,
    text: input.text,
  };
}

async function sendBrevoEmail(config: EmailApiConfigValue, input: EmailSendInput) {
  if (!config.apiBaseUrl || !config.apiKey) {
    throw badRequestError("Brevo 配置不完整", "BREVO_CONFIG_INCOMPLETE");
  }

  const { ok, status, data } = await httpPost<Record<string, unknown>>(
    normalizeBaseUrl(config.apiBaseUrl),
    buildBrevoPayload(config, input),
    {
      headers: { "api-key": config.apiKey },
      timeoutMs: config.timeoutMs || 15000,
    },
  );

  if (!ok) {
    const message = typeof data?.message === "string" ? data.message : "Brevo 发送邮件失败";
    throw externalServiceError(message, "BREVO_SEND_FAILED");
  }

  return {
    messageId: typeof data?.messageId === "string" ? data.messageId : undefined,
    raw: data,
  };
}

async function sendResendEmail(config: EmailApiConfigValue, input: EmailSendInput) {
  if (!config.apiKey) {
    throw badRequestError("Resend 配置不完整", "RESEND_CONFIG_INCOMPLETE");
  }

  const apiBaseUrl = config.apiBaseUrl || "https://api.resend.com";

  const { ok, status, data } = await httpPost<Record<string, unknown>>(
    `${normalizeBaseUrl(apiBaseUrl)}/emails`,
    buildResendPayload(config, input),
    {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      timeoutMs: config.timeoutMs || 15000,
    },
  );

  if (!ok) {
    const message = typeof data?.message === "string" ? data.message : "Resend 发送邮件失败";
    throw externalServiceError(message, "RESEND_SEND_FAILED");
  }

  return {
    messageId: typeof data?.id === "string" ? data.id : undefined,
    raw: data,
  };
}

export function createSmtpEmailAdapter(config: EmailSmtpConfigValue): EmailProviderAdapter {
  return {
    async send(input) {
      if (!config.smtpHost || !config.smtpPort) {
        throw badRequestError("SMTP 配置不完整", "SMTP_CONFIG_INCOMPLETE");
      }

      const { WorkerMailer } = await import("worker-mailer");
      await WorkerMailer.send(
        {
          host: config.smtpHost,
          port: config.smtpPort,
          secure: config.smtpSecure ?? false,
          credentials: config.smtpUsername
            ? { username: config.smtpUsername, password: config.smtpPassword ?? "" }
            : undefined,
          authType: config.smtpAuthType ?? "plain",
        },
        {
          from: { email: config.fromEmail, name: config.fromName },
          to: input.toEmail,
          reply: input.replyTo || config.replyTo || undefined,
          subject: input.subject,
          text: input.text,
          html: input.html,
        },
      );

      return {};
    },
  };
}

export function createApiEmailAdapter(config: EmailApiConfigValue): EmailProviderAdapter {
  const senders: Record<string, (config: EmailApiConfigValue, input: EmailSendInput) => Promise<{ messageId?: string; raw?: unknown }>> = {
    BREVO: sendBrevoEmail,
    RESEND: sendResendEmail,
  };

  return {
    async send(input) {
      const sender = senders[config.apiProvider] || sendBrevoEmail;
      return sender(config, input);
    },
  };
}
