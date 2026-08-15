import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { StudioChrome } from "@/components/studio-chrome";
import { requireNour } from "@/lib/nour-auth";

export const dynamic = "force-dynamic";

export default async function StudioLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  let user = null;
  try {
    user = await requireNour();
  } catch (error) {
    console.error("[escrowd] studio auth", error);
  }
  if (!user) {
    redirect({ href: "/sign-in", locale });
  } else {
    return <StudioChrome email={user.email ?? ""}>{children}</StudioChrome>;
  }
}
