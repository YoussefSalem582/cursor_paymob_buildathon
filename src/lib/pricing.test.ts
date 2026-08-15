import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBrief, priceBrief } from "./pricing.ts";

test("commercial portrait two subjects full render is 3x personal", () => {
  const personal = priceBrief({
    type: "portrait",
    subjects: 2,
    detail_level: "full render",
    background: "none",
    usage: "personal",
    revisions: 2,
  });
  const commercial = priceBrief({
    type: "portrait",
    subjects: 2,
    detail_level: "full render",
    background: "none",
    usage: "commercial",
    revisions: 2,
  });
  assert.equal(commercial.totalEgp, personal.totalEgp * 3);
  assert.equal(
    commercial.depositPiastres + commercial.balancePiastres,
    commercial.totalPiastres,
  );
});

test("parseBrief rejects unknown enums", () => {
  assert.equal(
    parseBrief({
      type: "mural",
      subjects: 1,
      detail_level: "sketch",
      background: "none",
      usage: "personal",
      revisions: 2,
    }),
    null,
  );
});

test("parseBrief accepts string counts and rejects out of range", () => {
  const ok = parseBrief({
    type: "portrait",
    subjects: "2",
    detail_level: "sketch",
    background: "simple",
    usage: "personal",
    revisions: "0",
  });
  assert.equal(ok?.subjects, 2);
  assert.equal(ok?.revisions, 0);
  assert.equal(
    parseBrief({
      type: "portrait",
      subjects: 9,
      detail_level: "sketch",
      background: "none",
      usage: "personal",
      revisions: 2,
    }),
    null,
  );
});
