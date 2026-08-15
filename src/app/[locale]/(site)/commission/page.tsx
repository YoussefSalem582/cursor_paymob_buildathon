import { setRequestLocale, getTranslations } from "next-intl/server";
import { EscrowdLogo } from "@/components/escrowd-logo";
import { CommissionForm } from "./commission-form";

export default async function CommissionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("commission");

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-6 sm:gap-12 sm:px-10 sm:py-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <div className="lg:sticky lg:top-24">
        <EscrowdLogo size={96} className="mb-4 size-12 sm:mb-6 sm:size-16" alt="" />
        <p className="text-[12px] uppercase tracking-[0.28em] text-clay">{t("kicker")}</p>
        <h2 className="mt-3 font-display text-4xl leading-none sm:text-5xl">{t("title")}</h2>
        <p className="mt-5 leading-relaxed text-muted">{t("subtitle")}</p>
      </div>
      <CommissionForm />
    </main>
  );
}
