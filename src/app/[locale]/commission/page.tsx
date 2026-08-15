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
    <main className="mx-auto grid w-full max-w-5xl gap-12 px-6 py-8 sm:px-10 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <EscrowdLogo size={96} className="mb-6 size-16" alt="" />
        <p className="text-[12px] uppercase tracking-[0.28em] text-clay">{t("kicker")}</p>
        <h2 className="mt-3 font-display text-5xl leading-none">{t("title")}</h2>
        <p className="mt-5 leading-relaxed text-muted">{t("subtitle")}</p>
      </div>
      <CommissionForm />
    </main>
  );
}
