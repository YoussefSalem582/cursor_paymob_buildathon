import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseCheckoutKind,
  parseContact,
  parseDeliveryFile,
  parseEgyptianMobile,
  parseIntInRange,
  parseMerchantOrderId,
  parseOrderId,
  parseOrderToken,
  parsePositiveInt,
  safeInternalPath,
} from "./validate.ts";

test("parseContact trims, lowercases email, and stores E.164 mobile", () => {
  const result = parseContact({
    name: "  نورة علي  ",
    email: "Nour@Studio.EG",
    phone: "01012345678",
  });
  assert.deepEqual(result, {
    ok: true,
    value: {
      name: "نورة علي",
      email: "nour@studio.eg",
      phone: "+201012345678",
    },
  });
});

test("parseEgyptianMobile accepts +20, 0020, Arabic digits, 011/012/015", () => {
  assert.equal(parseEgyptianMobile("+201112345678"), "+201112345678");
  assert.equal(parseEgyptianMobile("00201212345678"), "+201212345678");
  assert.equal(parseEgyptianMobile("٠١٥١٢٣٤٥٦٧٨"), "+201512345678");
  assert.equal(parseEgyptianMobile("02-12345678"), null);
  assert.equal(parseEgyptianMobile("0101234567"), null);
});

test("parseContact rejects short names, bad emails, and landlines", () => {
  assert.equal(parseContact({ name: "ن", email: "a@b.c", phone: "01012345678" }).ok, false);
  assert.equal(
    parseContact({ name: "Nour", email: "not-an-email", phone: "01012345678" }).ok,
    false,
  );
  assert.equal(
    parseContact({ name: "Nour", email: "nour@studio.eg", phone: "0223456789" }).ok,
    false,
  );
});

test("parseOrderToken is exactly 12 url-safe chars", () => {
  assert.equal(parseOrderToken("abcdefghijkl"), "abcdefghijkl");
  assert.equal(parseOrderToken("short"), null);
  assert.equal(parseOrderToken("../etc/passwd"), null);
  assert.equal(parseOrderId("not-a-uuid"), null);
  assert.equal(parseOrderId("2f1b8e6a-4c3d-4a9f-9b0e-1a2b3c4d5e6f")?.length, 36);
  assert.equal(parseCheckoutKind("deposit"), "deposit");
  assert.equal(parseCheckoutKind("refund"), null);
});

test("safeInternalPath blocks protocol-relative redirects", () => {
  assert.equal(safeInternalPath("/ar/dashboard"), "/ar/dashboard");
  assert.equal(safeInternalPath("//evil.example"), null);
  assert.equal(safeInternalPath("/\\evil.example"), null);
  assert.equal(safeInternalPath("https://evil.example"), null);
  assert.equal(safeInternalPath("/ok\n/no"), null);
});

test("parsePositiveInt rejects 0 and NaN", () => {
  assert.equal(parsePositiveInt(0), undefined);
  assert.equal(parsePositiveInt(""), undefined);
  assert.equal(parsePositiveInt("42"), 42);
  assert.equal(parseIntInRange("3", 1, 8), 3);
  assert.equal(parseIntInRange(1.5, 1, 8), null);
});

test("parseMerchantOrderId only accepts token:kind:attemptId", () => {
  assert.equal(
    parseMerchantOrderId("abcdefghijkl:deposit:attempt-1"),
    "abcdefghijkl:deposit:attempt-1",
  );
  assert.equal(parseMerchantOrderId("nope"), undefined);
});

test("parseDeliveryFile allows jpeg/png/webp under 8MB", () => {
  const png = new File([new Uint8Array(16)], "wall.png", { type: "image/png" });
  const parsed = parseDeliveryFile(png);
  assert.equal(parsed.ok, true);
  if (parsed.ok) assert.equal(parsed.value.ext, "png");

  const svg = new File(["<svg></svg>"], "x.svg", { type: "image/svg+xml" });
  assert.equal(parseDeliveryFile(svg).ok, false);

  const empty = new File([], "empty.png", { type: "image/png" });
  const missing = parseDeliveryFile(empty);
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.error, "missing_file");
});
