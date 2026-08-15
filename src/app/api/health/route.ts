import { NextResponse } from "next/server";
import { APP_NAME, APP_TAGLINE, environmentName, releaseVersion } from "@/lib/app-meta";

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
    },
    { headers: { "cache-control": "no-store" } },
  );
}
