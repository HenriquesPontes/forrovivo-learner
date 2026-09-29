/** Public App Store listing for ForroVivo. */
export const APP_STORE_URL = "https://apps.apple.com/app/id6751409176";

/** Google Play listing for ForroVivo. */
export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.hen.forrovivo";

/** Learning catalog API (Cloudflare Worker). */
export const API_ORIGIN = "https://api.forrovivo.com";

export const CATALOG_HEALTH_URL = `${API_ORIGIN}/app/v1/catalog/health`;
export const ACCOUNT_HEALTH_URL = `${API_ORIGIN}/app/v1/account/health`;

export const SITE_URL = "https://forrovivo.com";
export const LEARN_ORIGIN = "https://learn.forrovivo.com";

/** Optional Apple Sign In on the web (Services ID). Empty = social button disabled. */
export const APPLE_WEB_CLIENT_ID =
  process.env.NEXT_PUBLIC_APPLE_WEB_CLIENT_ID?.trim() || "";

/** Must match the Apple Services ID return URL. */
export const APPLE_WEB_REDIRECT_URI =
  process.env.NEXT_PUBLIC_APPLE_WEB_REDIRECT_URI?.trim() ||
  `${LEARN_ORIGIN}/`;

/** Optional Google Sign In on the web (OAuth client ID). Empty = social button disabled. */
export const GOOGLE_WEB_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || "";
