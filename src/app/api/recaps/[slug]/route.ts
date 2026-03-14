import { NextResponse } from "next/server";
import * as micrositeService from "@/services/media/microsite.service";

type Params = { params: Promise<{ slug: string }> };

/** Public route — NO AUTH required */
export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;

  const microsite = await micrositeService.getPublicMicrosite(slug);
  if (!microsite) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Set noindex header for unlisted microsites
  const headers: Record<string, string> = {};
  if (microsite.visibilityMode === "unlisted") {
    headers["X-Robots-Tag"] = "noindex, nofollow";
  }

  return NextResponse.json({ microsite }, { headers });
}
