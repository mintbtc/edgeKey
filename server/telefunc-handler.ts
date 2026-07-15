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
    dev: true,
    prod: true,
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
    if (statusCode === 500 && "err" in httpResponse) {
      logger.error(httpResponse.err instanceof Error ? httpResponse.err : new Error(String(httpResponse.err)), {
        event: "telefunc.unhandled",
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
