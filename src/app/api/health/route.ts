import { NextResponse } from "next/server";
import { APP_NAME, APP_TAGLINE, environmentName, releaseVersion } from "@/lib/app-meta";
import {
  PAYMOB_WEBHOOK_PATH,
  paymobConfigured,
  publicSiteOrigin,
} from "@/lib/paymob";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      app: APP_NAME,
      tagline: APP_TAGLINE,
      status: "ok",
      environment: environmentName(),
      version: releaseVersion(),
      timestamp: new Date().toISOString(),
      paymob: {
        configured: paymobConfigured(),
        webhook_path: PAYMOB_WEBHOOK_PATH,
        public_origin: publicSiteOrigin(),
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}
