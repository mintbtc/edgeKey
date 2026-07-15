import { assertAdminAccess } from "../../../modules/auth/service";
import { listAdminProducts } from "../../../modules/catalog/queries";
import { getContext } from "telefunc";
import { throwAbortError } from "../../../lib/throw-abort-error";

export async function onQueryProducts(input: {
  name?: string;
  status?: string;
  page: number;
  pageSize: number;
}) {
  try {
    assertAdminAccess();
    const { prisma } = getContext() as any;
    const all = await listAdminProducts(prisma);

    let items = all;
    if (input.name) items = items.filter(p => p.name.includes(input.name!));
    if (input.status) items = items.filter(p => p.status === input.status);

    const total = items.length;
    const start = (input.page - 1) * input.pageSize;
    return { items: items.slice(start, start + input.pageSize), total };
  } catch (error) {
    throwAbortError(error);
  }
}
