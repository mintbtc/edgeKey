import { enhance, type UniversalHandler } from "@universal-middleware/core";
import { config, provideTelefuncContext, telefunc } from "telefunc";
import { logger } from "../lib/logger";

function withUtf8Charset(contentType: string) {
  return /charset=/i.test(contentType) ? contentType : `${contentType}; charset=utf-8`;
}

/**
 * Telefunc's dev-time naming/collocation check reads the filesystem directly.
 * Under the current Windows + workerd dev runtime, that check resolves paths
 * incorrectly, so we disable only the convention check and keep telefunc
 * loading/dispatching behavior unchanged.
 */
config.disableNamingConvention = true;
config.log = {
  shieldErrors: {
    dev: false,
    prod: false,
  },
};

// Note: You can directly define a server middleware instead of defining a Universal Middleware. (You can remove @universal-middleware/* — Vike's scaffolder uses it only to simplify its internal logic, see https://github.com/vikejs/vike/discussions/3116)
export const telefuncHandler: UniversalHandler = enhance(
  async (request, context, runtime) => {
    provideTelefuncContext(context as any);
    const httpResponse = await telefunc({
      request,
      context: {
        ...context,
        ...runtime,
      } as any,
    });

    const { body, statusCode, contentType } = httpResponse;
    if (statusCode >= 400 && "err" in httpResponse) {
      const error = httpResponse.err;
      logger.error(error instanceof Error ? error : new Error(String(error)), {
        event: "telefunc.unhandled",
      });
      
      // 手动构造错误响应，确保客户端能收到具体错误信息
      const errorPayload = {
        message: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code,
        statusCode: (error as any)?.statusCode || statusCode,
      };
      
      return new Response(JSON.stringify(errorPayload), {
        status: statusCode,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      });
    }
    return new Response(body, {
      status: statusCode,
      headers: {
        "content-type": withUtf8Charset(contentType),
      },
    });
  },
  {
    name: "my-app:telefunc-handler",
    path: `/_telefunc`,
    method: ["GET", "POST"],
    immutable: false,
  },
);
