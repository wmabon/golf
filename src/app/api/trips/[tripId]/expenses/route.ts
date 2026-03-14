import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as expenseService from "@/services/billing/expense.service";
import { createExpenseSchema } from "@/lib/validation/expenses";

type Params = { params: Promise<{ tripId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const expenses = await expenseService.listExpenses(tripId);
  return NextResponse.json({ expenses });
}

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const parsed = await parseBody(request, createExpenseSchema);
  if ("error" in parsed) return parsed.error;

  const expense = await expenseService.createExpense(
    tripId,
    session!.user!.id!,
    parsed.data
  );

  return NextResponse.json({ expense }, { status: 201 });
}
