import { test } from "node:test";
import assert from "node:assert/strict";
import { deliveriesObjectPath } from "./delivery-path.ts";

test("deliveriesObjectPath reads a stored path", () => {
  assert.equal(
    deliveriesObjectPath("abc/final-1.jpg"),
    "abc/final-1.jpg",
  );
  assert.equal(deliveriesObjectPath("/abc/preview.png"), "abc/preview.png");
});

test("deliveriesObjectPath extracts a public or signed storage URL", () => {
  assert.equal(
    deliveriesObjectPath(
      "https://proj.supabase.co/storage/v1/object/public/deliveries/abc/final-1.jpg",
    ),
    "abc/final-1.jpg",
  );
  assert.equal(
    deliveriesObjectPath(
      "https://proj.supabase.co/storage/v1/object/sign/deliveries/abc/preview.webp?token=x",
    ),
    "abc/preview.webp",
  );
});

test("deliveriesObjectPath rejects traversal and unknown hosts", () => {
  assert.equal(deliveriesObjectPath("../secret.jpg"), null);
  assert.equal(deliveriesObjectPath("https://secret.example/final.png"), null);
  assert.equal(deliveriesObjectPath(null), null);
});
