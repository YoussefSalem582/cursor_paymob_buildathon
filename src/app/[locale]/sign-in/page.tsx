import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthForm } from "@/components/auth-form";
import { signIn } from "@/lib/auth-actions";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; "check-email"?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { next, "check-email": checkEmail } = await searchParams;
  const t = await getTranslations();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 py-16">
      <Card className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <CardTitle>{t("auth.signInTitle")}</CardTitle>
          <CardDescription>{t("auth.signInSubtitle")}</CardDescription>
        </div>

        {checkEmail && (
          <p className="border border-line px-3 py-2 text-sm">
            {t("auth.checkEmail")}
          </p>
        )}

        <AuthForm
          action={signIn}
          locale={locale}
          next={typeof next === "string" ? next : undefined}
          labels={{
            email: t("auth.email"),
            password: t("auth.password"),
            submit: t("auth.signInAction"),
          }}
        />

        <CardDescription>
          {t("auth.noAccount")}{" "}
          <Link href="/sign-up" className="underline">
            {t("nav.signUp")}
          </Link>
        </CardDescription>
      </Card>
    </div>
  );
}
