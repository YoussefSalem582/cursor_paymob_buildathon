import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { EscrowdLogoFrame } from "@/components/escrowd-logo";
import { buttonBase, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const pieces = [
  { title: "Date seller, Khan el-Khalili", tone: "from-[#c45c3e] to-[#1c1915]", year: "2025" },
  { title: "Night tram, Heliopolis", tone: "from-[#3f5348] to-[#1c1915]", year: "2025" },
  { title: "Orange seller study", tone: "from-[#d8a15a] to-[#9a3d26]", year: "2024" },
  { title: "Balcony with laundry", tone: "from-[#6b7c8a] to-[#1c1915]", year: "2024" },
  { title: "Girl with clay pot", tone: "from-[#c47a6a] to-[#3f5348]", year: "2026" },
  { title: "Felucca at dusk", tone: "from-[#2c3a4a] to-[#c45c3e]", year: "2026" },
];

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const ta = await getTranslations("app");

  return (
    <main>
      <section className="grid gap-10 px-6 pb-16 pt-4 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <p className="text-[12px] uppercase tracking-[0.32em] text-clay">{t("kicker")}</p>
          <h2 className="mt-4 max-w-xl font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">
            {t("title")}
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">{t("subtitle")}</p>
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
          <EscrowdLogoFrame
            className="aspect-square border border-line"
            alt={ta("logoAlt")}
            priority
          />
          <figcaption className="mt-4">
            <p className="font-display text-2xl">{t("heroCaption")}</p>
            <p className="text-sm text-muted">{t("heroMeta")}</p>
          </figcaption>
        </figure>
      </section>

      <section id="work" className="border-t border-line px-6 py-14 sm:px-10">
        <div className="mb-8 flex items-end justify-between">
          <h3 className="font-display text-3xl">{t("workTitle")}</h3>
          <p className="text-sm text-muted">{t("workNote")}</p>
        </div>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pieces.map((piece) => (
            <li key={piece.title}>
              <div className={`aspect-[4/5] bg-gradient-to-br ${piece.tone}`} />
              <p className="mt-3 font-display text-xl">{piece.title}</p>
              <p className="text-sm text-muted">{piece.year}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
