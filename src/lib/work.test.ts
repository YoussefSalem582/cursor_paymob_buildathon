import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatWorkSize,
  formatWorkYear,
  heroWork,
  selectedWork,
} from "./work.ts";

test("selected work has a featured landscape lead and six pieces", () => {
  assert.equal(selectedWork.length, 6);
  assert.equal(selectedWork.filter((piece) => piece.featured).length, 1);
  assert.ok(heroWork.src.startsWith("/work/"));
  for (const piece of selectedWork) {
    assert.ok(piece.src.startsWith("/work/"));
    assert.ok(piece.widthCm > 0);
    assert.ok(piece.heightCm > 0);
  }
});

test("work year and size follow the page locale", () => {
  assert.equal(formatWorkYear("en", 2025), "2025");
  assert.equal(formatWorkYear("ar", 2025), "٢٠٢٥");
  assert.equal(formatWorkSize("en", 70, 50), "70×50 cm");
  assert.equal(formatWorkSize("ar", 70, 50), "٧٠×٥٠ سم");
});
