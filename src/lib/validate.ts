export const ORDER_TOKEN_RE = /^[A-Za-z0-9_-]{12}$/;
export const ORDER_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const NAME_MAX = 80;
export const EMAIL_MAX = 254;
export const MAX_DELIVERY_BYTES = 8 * 1024 * 1024;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const EASTERN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

const DELIVERY_TYPES: Record<string, "jpg" | "png" | "webp"> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type Contact = {
  name: string;
  email: string;
  phone: string;
};

export type ContactField = "name" | "email" | "phone";
export type ContactError = "invalid_name" | "invalid_email" | "invalid_phone";

export type ParseOk<T> = { ok: true; value: T };
export type ParseErr<E extends string, F extends string = string> = {
  ok: false;
  error: E;
  field?: F;
};
export type ParseResult<T, E extends string, F extends string = string> =
  | ParseOk<T>
  | ParseErr<E, F>;

export function isOrderToken(value: string): boolean {
  return ORDER_TOKEN_RE.test(value);
}

export function isOrderId(value: string): boolean {
  return ORDER_ID_RE.test(value);
}

export function parseOrderToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const token = value.trim();
  return isOrderToken(token) ? token : null;
}

export function parseOrderId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  return isOrderId(id) ? id : null;
}

export function parseCheckoutKind(value: unknown): "deposit" | "balance" | null {
  return value === "deposit" || value === "balance" ? value : null;
}

export function parsePositiveInt(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? value : undefined;
  }
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const n = Number(value.trim());
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

export function parseIntInRange(
  value: unknown,
  min: number,
  max: number,
): number | null {
  let n: number;
  if (typeof value === "number") n = value;
  else if (typeof value === "string" && value.trim() !== "") n = Number(value.trim());
  else return null;
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

function westernDigits(raw: string) {
  return [...raw]
    .map((ch) => {
      const ar = ARABIC_DIGITS.indexOf(ch);
      if (ar >= 0) return String(ar);
      const fa = EASTERN_DIGITS.indexOf(ch);
      if (fa >= 0) return String(fa);
      return ch;
    })
    .join("");
}

/** Store E.164 (`+2010…`) so Paymob billing_data gets a real mobile. */
export function parseEgyptianMobile(raw: string): string | null {
  let digits = westernDigits(raw).replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("20")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (!/^1[0125]\d{8}$/.test(digits)) return null;
  return `+20${digits}`;
}

export function parseEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!email || email.length > EMAIL_MAX) return null;
  if (email.includes("..") || email.startsWith(".") || email.endsWith(".")) {
    return null;
  }
  if (!EMAIL_RE.test(email)) return null;
  return email;
}

export function parseName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > NAME_MAX) return null;
  if (!/\p{L}/u.test(name)) return null;
  return name;
}

export function parseContact(input: {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
}): ParseResult<Contact, ContactError, ContactField> {
  const name = parseName(input.name);
  if (!name) return { ok: false, error: "invalid_name", field: "name" };
  const email = parseEmail(input.email);
  if (!email) return { ok: false, error: "invalid_email", field: "email" };
  const phone = typeof input.phone === "string" ? parseEgyptianMobile(input.phone) : null;
  if (!phone) return { ok: false, error: "invalid_phone", field: "phone" };
  return { ok: true, value: { name, email, phone } };
}

export type DeliveryFileError =
  | "missing_file"
  | "invalid_file_type"
  | "file_too_large";

export function parseDeliveryFile(
  file: unknown,
): ParseResult<{ file: File; ext: "jpg" | "png" | "webp" }, DeliveryFileError> {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "missing_file" };
  }
  if (file.size > MAX_DELIVERY_BYTES) {
    return { ok: false, error: "file_too_large" };
  }
  const fromType = DELIVERY_TYPES[file.type];
  const name = file.name.toLowerCase();
  const fromName = name.endsWith(".png")
    ? "png"
    : name.endsWith(".webp")
      ? "webp"
      : name.endsWith(".jpg") || name.endsWith(".jpeg")
        ? "jpg"
        : null;
  const ext = fromType ?? (file.type ? null : fromName);
  if (!ext) return { ok: false, error: "invalid_file_type" };
  return { ok: true, value: { file, ext } };
}

/** Only same-origin relative paths. Blocks `//evil.com` open redirects. */
export function safeInternalPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const path = value.trim();
  if (!path.startsWith("/")) return null;
  if (path.startsWith("//") || path.startsWith("/\\")) return null;
  if (path.includes("://") || path.includes("\\")) return null;
  if (/[\0\r\n]/.test(path)) return null;
  return path;
}

export function parseMerchantOrderId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const ref = value.trim();
  const [token, kind, attemptId] = ref.split(":");
  if (!isOrderToken(token ?? "") || !attemptId) return undefined;
  if (kind !== "deposit" && kind !== "balance") return undefined;
  return ref;
}
