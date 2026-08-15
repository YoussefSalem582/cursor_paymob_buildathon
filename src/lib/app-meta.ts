export const APP_NAME = "Escrowd";
export const APP_TAGLINE = "Creative Work, Clearly Agreed";
export const LOGO_MARK = "/brand/escrowd-mark.png";
export const LOGO_LOCKUP = "/brand/escrowd-lockup.png";
export const LOGO_MARK_DARK = "/brand/escrowd-mark-dark.png";
export const LOGO_LOCKUP_DARK = "/brand/escrowd-lockup-dark.png";

export function environmentName(): string {
  return process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown";
}

export function releaseVersion(): string {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  if (sha) return sha.slice(0, 7);
  return process.env.npm_package_version ?? "0.1.0";
}
