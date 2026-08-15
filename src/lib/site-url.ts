/**
 * Public origin for Paymob notification_url and redirection_url.
 * Prefer NEXT_PUBLIC_SITE_URL (no trailing slash).
 */
export function publicSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (productionHost) return `https://${productionHost}`;

  const deploymentHost = process.env.VERCEL_URL;
  if (deploymentHost) return `https://${deploymentHost}`;

  throw new Error(
    "Missing NEXT_PUBLIC_SITE_URL. Set the public HTTPS origin so Paymob can hit the webhook.",
  );
}
