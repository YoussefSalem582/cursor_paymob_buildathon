import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthForm } from "@/components/auth-form";
import { EscrowdLogo } from "@/components/escrowd-logo";
import { signIn } from "@/lib/auth-actions";
import { requireNour } from "@/lib/nour-auth";
import { safeInternalPath } from "@/lib/validate";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; "check-email"?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (await requireNour()) redirect({ href: "/dashboard", locale });
  const { next, "check-email": checkEmail } = await searchParams;
  const t = await getTranslations();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-10 sm:px-6 sm:py-16">
      <Card className="flex flex-col gap-5">
        <EscrowdLogo size={96} className="size-16" alt={t("app.logoAlt")} />
        <div className="flex flex-col gap-1">
          <CardTitle>{t("auth.signInTitle")}</CardTitle>
          <CardDescription>{t("auth.signInSubtitle")}</CardDescription>
        </div>

        {checkEmail && (
          <p className="border border-sage/40 bg-sage/10 px-3 py-2 text-sm">
            {t("auth.checkEmail")}
          </p>
        )}

        <AuthForm
          action={signIn}
          locale={locale}
          next={typeof next === "string" ? (safeInternalPath(next) ?? undefined) : undefined}
          labels={{
            email: t("auth.email"),
            emailPlaceholder: t("auth.emailPlaceholder"),
            password: t("auth.password"),
            passwordHint: t("auth.passwordHint"),
            submit: t("auth.signInAction"),
          }}
        />
      </Card>
    </div>
  );
}
