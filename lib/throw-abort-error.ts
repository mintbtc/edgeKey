import { Abort } from "telefunc";
import { toAppError } from "./app-error";

/**
 * 捕获业务错误并转为 telefunc Abort，使客户端能收到具体错误信息。
 *
 * telefunc 的规则：
 * - throw new Error()   → bug，客户端只收到 "Internal Server Error"
 * - throw Abort(value)  → 预期错误，value 会发送到客户端
 *
 * 在每个 .telefunc.ts 的 catch 块中使用：
 * ```ts
 * catch (error) {
 *   throwAbortError(error);
 * }
 * ```
 */
export function throwAbortError(error: unknown): never {
  const appError = toAppError(error);
  throw Abort({
    message: appError.message,
    code: appError.code,
    statusCode: appError.statusCode,
  });
}
