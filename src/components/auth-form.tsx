"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

type AuthAction = (
  prevState: string | null,
  formData: FormData,
) => Promise<string | null | undefined | void>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full">
      {label}
    </Button>
  );
}

/** Shared by sign-in and sign-up — only the server action differs. */
export function AuthForm({
  action,
  locale,
  next,
  labels,
}: {
  action: AuthAction;
  locale: string;
  next?: string;
  labels: {
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordHint: string;
    submit: string;
  };
}) {
  const t = useTranslations("auth");
  const [error, formAction] = useActionState<string | null, FormData>(
    async (prev, formData) => (await action(prev, formData)) ?? null,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="locale" value={locale} />
      {next && <input type="hidden" name="next" value={next} />}

      <Input
        label={labels.email}
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        spellCheck={false}
        dir="ltr"
        required
        placeholder={labels.emailPlaceholder}
      />
      <Input
        label={labels.password}
        name="password"
        type="password"
        autoComplete="current-password"
        minLength={6}
        required
        hint={labels.passwordHint}
      />

      {error ? <FieldError>{error === "invalid" ? t("invalid") : error}</FieldError> : null}

      <SubmitButton label={labels.submit} />
    </form>
  );
}
