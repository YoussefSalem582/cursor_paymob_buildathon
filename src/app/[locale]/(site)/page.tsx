import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonBase, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const pieces = [
  {
    title: "pieceDate",
    medium: "mediumPastel",
    year: "2025",
    tone: "from-[#c45c3e] to-[#1c1915]",
  },
  {
    title: "pieceTram",
    medium: "mediumInk",
    year: "2025",
    tone: "from-[#3f5348] to-[#1c1915]",
  },
  {
    title: "pieceOrange",
    medium: "mediumStudy",
    year: "2024",
    tone: "from-[#d8a15a] to-[#9a3d26]",
  },
  {
    title: "pieceBalcony",
    medium: "mediumPastel",
    year: "2024",
    tone: "from-[#6b7c8a] to-[#1c1915]",
  },
  {
    title: "piecePot",
    medium: "mediumPastel",
    year: "2026",
    tone: "from-[#c47a6a] to-[#3f5348]",
  },
  {
    title: "pieceFelucca",
    medium: "mediumInk",
    year: "2026",
    tone: "from-[#2c3a4a] to-[#c45c3e]",
  },
] as const;

const steps = [
  { title: "step1Title", body: "step1Body" },
  { title: "step2Title", body: "step2Body" },
  { title: "step3Title", body: "step3Body" },
] as const;

function stepIndex(locale: string, n: number) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    minimumIntegerDigits: 2,
  }).format(n);
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <main>
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 pb-16 pt-4 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-[12px] uppercase tracking-[0.32em] text-clay">
            {t("kicker")}
          </p>
          <h1 className="mt-4 max-w-xl font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">
            {t("title")}
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
            {t("subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/commission"
              className={cn(buttonBase, buttonVariants.primary)}
            >
              {t("cta")}
            </Link>
            <Link
              href="/#work"
              className={cn(buttonBase, buttonVariants.secondary)}
            >
              {t("seeWork")}
            </Link>
          </div>
        </div>
        <figure>
          <div className="border border-line bg-paper p-2 sm:p-3">
            <div className="aspect-[4/5] bg-gradient-to-br from-[#c45c3e] via-[#9a3d26] to-[#1c1915]" />
          </div>
          <figcaption className="mt-4 flex items-baseline justify-between gap-4">
            <p className="font-display text-2xl">{t("heroCaption")}</p>
            <p className="text-sm text-muted">{t("heroMeta")}</p>
          </figcaption>
        </figure>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-6 py-14 sm:px-10">
          <p className="text-[12px] uppercase tracking-[0.28em] text-clay">
            {t("stepsKicker")}
          </p>
          <h2 className="mt-3 max-w-lg font-display text-4xl leading-none">
            {t("stepsTitle")}
          </h2>
          <ol className="mt-10 grid gap-4 lg:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="border border-line p-5">
                <p className="flex size-8 items-center justify-center bg-clay text-sm text-paper tabular-nums">
                  {stepIndex(locale, index + 1)}
                </p>
                <h3 className="mt-4 font-display text-2xl">{t(step.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {t(step.body)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="work" className="scroll-mt-24 border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-6 py-14 sm:px-10">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-display text-3xl">{t("workTitle")}</h2>
            <p className="max-w-sm text-sm text-muted">{t("workNote")}</p>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pieces.map((piece, index) => (
              <li
                key={piece.title}
                className={index === 0 ? "sm:col-span-2 lg:col-span-2" : undefined}
              >
                <div className="border border-line bg-paper p-2 transition-colors hover:border-ink sm:p-3">
                  <div
                    className={cn(
                      "bg-gradient-to-br",
                      piece.tone,
                      index === 0 ? "aspect-[5/3] sm:aspect-[16/10]" : "aspect-[4/5]",
                    )}
                  />
                </div>
                <p className="mt-3 font-display text-xl">{t(piece.title)}</p>
                <p className="text-sm text-muted">
                  {t(piece.medium)} · {piece.year}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-6 py-16 sm:px-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-display text-4xl leading-none">{t("closeTitle")}</h2>
            <p className="mt-3 max-w-md leading-relaxed text-muted">
              {t("closeBody")}
            </p>
          </div>
          <Link
            href="/commission"
            className={cn(buttonBase, buttonVariants.clay)}
          >
            {t("cta")}
          </Link>
        </div>
      </section>
    </main>
  );
}
