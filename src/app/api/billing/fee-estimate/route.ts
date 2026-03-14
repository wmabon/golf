import { NextResponse } from "next/server";
import { requireAuth, parseBody } from "@/lib/api-utils";
import { feeEstimateSchema } from "@/lib/validation/billing";
import * as feeDisclosureService from "@/services/billing/fee-disclosure.service";

export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const parsed = await parseBody(request, feeEstimateSchema);
  if ("error" in parsed) return parsed.error;

  const { type, baseCost, numGolfers } = parsed.data;

  const estimate = await feeDisclosureService.calculateFeeEstimate(
    type,
    baseCost,
    numGolfers
  );

  return NextResponse.json({
    serviceFee: estimate.serviceFee,
    passThrough: estimate.passThrough,
    total: estimate.total,
    lineItems: estimate.lineItems,
  });
}
