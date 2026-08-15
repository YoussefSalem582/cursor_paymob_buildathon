export const BRIEF_TYPES = [
  "portrait",
  "character",
  "logo-mascot",
  "menu-set",
] as const;
export const DETAIL_LEVELS = ["sketch", "flat colour", "full render"] as const;
export const BACKGROUNDS = ["none", "simple", "full scene"] as const;
export const USAGES = ["personal", "commercial"] as const;

export type BriefType = (typeof BRIEF_TYPES)[number];
export type DetailLevel = (typeof DETAIL_LEVELS)[number];
export type Background = (typeof BACKGROUNDS)[number];
export type Usage = (typeof USAGES)[number];

export type Brief = {
  type: BriefType;
  subjects: number;
  detail_level: DetailLevel;
  background: Background;
  usage: Usage;
  revisions: number;
};

const BASE: Record<BriefType, number> = {
  portrait: 800,
  character: 1200,
  "logo-mascot": 3000,
  "menu-set": 2500,
};

const DETAIL: Record<DetailLevel, number> = {
  sketch: 0.5,
  "flat colour": 1.0,
  "full render": 1.6,
};

const BACKGROUND: Record<Background, number> = {
  none: 0,
  simple: 300,
  "full scene": 900,
};

const USAGE: Record<Usage, number> = {
  personal: 1.0,
  commercial: 3.0,
};

export type PricedBrief = {
  totalEgp: number;
  totalPiastres: number;
  depositPiastres: number;
  balancePiastres: number;
};

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

export function parseBrief(input: unknown): Brief | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  if (!isOneOf(raw.type, BRIEF_TYPES)) return null;
  if (!isOneOf(raw.detail_level, DETAIL_LEVELS)) return null;
  if (!isOneOf(raw.background, BACKGROUNDS)) return null;
  if (!isOneOf(raw.usage, USAGES)) return null;
  const subjects = Number(raw.subjects);
  const revisions = Number(raw.revisions ?? 2);
  if (!Number.isInteger(subjects) || subjects < 1 || subjects > 8) return null;
  if (!Number.isInteger(revisions) || revisions < 0 || revisions > 6) return null;
  return {
    type: raw.type,
    subjects,
    detail_level: raw.detail_level,
    background: raw.background,
    usage: raw.usage,
    revisions,
  };
}

/** Same function for the live UI and the server Intention amount. */
export function priceBrief(brief: Brief): PricedBrief {
  const base = BASE[brief.type];
  const extra = Math.max(0, brief.subjects - 1) * 0.6 * base;
  let egp = (base + extra) * DETAIL[brief.detail_level] + BACKGROUND[brief.background];
  egp *= USAGE[brief.usage];
  const totalEgp = Math.round(egp);
  const totalPiastres = Math.round(totalEgp * 100);
  const depositPiastres = Math.round(totalPiastres / 2);
  return {
    totalEgp,
    totalPiastres,
    depositPiastres,
    balancePiastres: totalPiastres - depositPiastres,
  };
}
