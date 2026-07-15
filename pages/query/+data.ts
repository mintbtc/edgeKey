import type { PrismaClient } from "../../generated/prisma/client";
import { getSiteSetting } from "../../modules/site/service";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: {
  prisma: PrismaClient;
}) {
  const site = await getSiteSetting(pageContext.prisma);
  return {
    timezone: site.timezone || "Asia/Shanghai",
  };
}
