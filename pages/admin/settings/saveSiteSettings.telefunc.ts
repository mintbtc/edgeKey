import { assertAdminAccess } from "../../../modules/auth/service";
import { saveSiteSetting } from "../../../modules/site/service";
import { throwAbortError } from "../../../lib/throw-abort-error";

export async function onSaveSiteSettings(input: {
  siteName: string;
  siteUrl?: string;
  siteSubtitle?: string;
  logoIcon?: string;
  logo?: string;
  notice?: string;
  supportContact?: string;
  footerText?: string;
  orderNotice?: string;
  headCode?: string;
  footerCode?: string;
  timezone?: string;
}) {
  try {
    assertAdminAccess();
    return await saveSiteSetting(input);
  } catch (error) {
    throwAbortError(error);
  }
}
