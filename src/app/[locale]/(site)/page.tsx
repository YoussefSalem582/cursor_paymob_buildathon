import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonBase, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatWorkSize,
  formatWorkYear,
  heroWork,
  selectedWork,
} from "@/lib/work";

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

function WorkFrame({
  src,
  alt,
  frameClassName,
  sizes,
  priority = false,
}: {
  src: string;
  alt: string;
  frameClassName: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <div className="border border-line bg-paper p-2 transition-colors hover:border-ink sm:p-3">
      <div className={cn("relative overflow-hidden bg-line", frameClassName)}>
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes={sizes}
          priority={priority}
        />
      </div>
    </div>
  );
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
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-12 pt-2 sm:gap-10 sm:px-10 sm:pb-16 sm:pt-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-[12px] uppercase tracking-[0.32em] text-clay">
            {t("kicker")}
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-[1.15] sm:text-6xl sm:leading-[1.12]">
            {t("title")}
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
            {t("subtitle")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/commission"
              className={cn(buttonBase, buttonVariants.primary, "w-full sm:w-auto")}
            >
              {t("cta")}
            </Link>
            <Link
              href="/#work"
              className={cn(buttonBase, buttonVariants.secondary, "w-full sm:w-auto")}
            >
              {t("seeWork")}
            </Link>
          </div>
        </div>
        <figure className="min-w-0">
          <WorkFrame
            src={heroWork.src}
            alt={t("heroCaption")}
            frameClassName="aspect-[4/5]"
            sizes="(min-width: 1024px) 45vw, 100vw"
            priority
          />
          <figcaption className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <p className="font-display text-xl sm:text-2xl">{t("heroCaption")}</p>
            <p className="text-sm text-muted">
              {[
                t(heroWork.medium),
                t(heroWork.place),
                formatWorkSize(locale, heroWork.widthCm, heroWork.heightCm),
                formatWorkYear(locale, heroWork.year),
              ].join(" · ")}
            </p>
          </figcaption>
        </figure>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-10 sm:py-14">
          <p className="text-[12px] uppercase tracking-[0.28em] text-clay">
            {t("stepsKicker")}
          </p>
          <h2 className="mt-3 max-w-lg font-display text-3xl leading-none sm:text-4xl">
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

      <section id="about" className="scroll-mt-32 border-t border-line lg:scroll-mt-24">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-10 sm:py-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-[12px] uppercase tracking-[0.28em] text-clay">
              {t("aboutKicker")}
            </p>
            <h2 className="mt-3 max-w-lg font-display text-3xl leading-none sm:text-4xl">
              {t("aboutTitle")}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink sm:text-lg">
              {t("aboutLead")}
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              {t("aboutBody")}
            </p>
          </div>
          <dl className="grid gap-4 border border-line p-5 sm:p-6">
            <div>
              <dt className="text-[12px] uppercase tracking-[0.28em] text-muted">
                {t("aboutWhereLabel")}
              </dt>
              <dd className="mt-1 font-display text-2xl">{t("aboutWhere")}</dd>
            </div>
            <div>
              <dt className="text-[12px] uppercase tracking-[0.28em] text-muted">
                {t("aboutPayLabel")}
              </dt>
              <dd className="mt-1 font-display text-2xl">{t("aboutPay")}</dd>
            </div>
            <div>
              <dt className="text-[12px] uppercase tracking-[0.28em] text-muted">
                {t("aboutLockLabel")}
              </dt>
              <dd className="mt-1 font-display text-2xl">{t("aboutLock")}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section id="work" className="scroll-mt-32 border-t border-line lg:scroll-mt-24">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-10 sm:py-14">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-display text-3xl">{t("workTitle")}</h2>
            <p className="max-w-sm text-sm text-muted">{t("workNote")}</p>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {selectedWork.map((piece) => (
              <li
                key={piece.id}
                className={piece.featured ? "sm:col-span-2 lg:col-span-2" : undefined}
              >
                <WorkFrame
                  src={piece.src}
                  alt={t(piece.title)}
                  frameClassName={
                    piece.featured
                      ? "aspect-[5/3] sm:aspect-[16/10]"
                      : "aspect-[4/5]"
                  }
                  sizes={
                    piece.featured
                      ? "(min-width: 1024px) 66vw, 100vw"
                      : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  }
                />
                <p className="mt-3 font-display text-xl">{t(piece.title)}</p>
                <p className="text-sm text-muted">
                  {[
                    t(piece.medium),
                    t(piece.place),
                    formatWorkSize(locale, piece.widthCm, piece.heightCm),
                    formatWorkYear(locale, piece.year),
                  ].join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-stretch gap-6 px-4 py-12 sm:px-10 sm:py-16 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-display text-3xl leading-none sm:text-4xl">{t("closeTitle")}</h2>
            <p className="mt-3 max-w-md leading-relaxed text-muted">
              {t("closeBody")}
            </p>
          </div>
          <Link
            href="/commission"
            className={cn(buttonBase, buttonVariants.clay, "w-full sm:w-auto")}
          >
            {t("cta")}
          </Link>
        </div>
      </section>
    </main>
  );
}
