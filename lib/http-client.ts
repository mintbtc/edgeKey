/**
 * 统一 HTTP 请求封装
 * 支持超时、重试、错误处理
 */

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

export interface HttpResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  raw: Response;
}

class HttpError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  return await response.text().catch(() => null);
}

/**
 * 发送 HTTP 请求
 */
export async function httpRequest<T = unknown>(
  url: string,
  options: RequestOptions = {},
): Promise<HttpResponse<T>> {
  const {
    method = "GET",
    headers = {},
    body,
    timeoutMs = 15000,
    retries = 0,
    retryDelayMs = 1000,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "edgeKey/1.0",
      ...headers,
    },
    signal: controller.signal,
  };

  if (body !== undefined && method !== "GET") {
    fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      const data = await parseResponse(response) as T;

      return {
        ok: response.ok,
        status: response.status,
        data,
        raw: response,
      };
    } catch (error: any) {
      lastError = error;

      if (error.name === "AbortError") {
        clearTimeout(timeoutId);
        throw new HttpError(`请求超时 (${timeoutMs}ms)`, 408);
      }

      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, retryDelayMs * (attempt + 1)));
      }
    }
  }

  clearTimeout(timeoutId);
  throw lastError || new HttpError("请求失败");
}

/**
 * POST 请求快捷方法
 */
export async function httpPost<T = unknown>(
  url: string,
  body: unknown,
  options: Omit<RequestOptions, "method" | "body"> = {},
): Promise<HttpResponse<T>> {
  return httpRequest<T>(url, { ...options, method: "POST", body });
}
