export const DELIVERIES_BUCKET = "deliveries";

const STORAGE_MARKERS = [
  "/object/public/deliveries/",
  "/object/sign/deliveries/",
  "/object/authenticated/deliveries/",
] as const;

/** Object path inside `deliveries`, or null if this is not a bucket object. */
export function deliveriesObjectPath(
  urlOrPath: string | null | undefined,
): string | null {
  if (!urlOrPath) return null;
  const value = urlOrPath.trim();
  if (!value || value.includes("..")) return null;

  if (!/^https?:\/\//i.test(value)) {
    return value.replace(/^\/+/, "") || null;
  }

  try {
    const url = new URL(value);
    for (const marker of STORAGE_MARKERS) {
      const index = url.pathname.indexOf(marker);
      if (index >= 0) {
        const rest = url.pathname.slice(index + marker.length);
        return decodeURIComponent(rest) || null;
      }
    }
  } catch {
    return null;
  }
  return null;
}
