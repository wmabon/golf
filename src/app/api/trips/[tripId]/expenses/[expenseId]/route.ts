import { NextResponse } from "next/server";
import { requireAuth, parseBody, errorResponse } from "@/lib/api-utils";
import * as tripService from "@/services/trip/trip.service";
import * as expenseService from "@/services/billing/expense.service";
import { updateExpenseSchema } from "@/lib/validation/expenses";

type Params = { params: Promise<{ tripId: string; expenseId: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, expenseId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const expense = await expenseService.getExpense(expenseId);
  if (!expense) return errorResponse("Expense not found", 404);
  if (expense.tripId !== tripId) return errorResponse("Expense not found", 404);

  // Only the creator or captain can update
  const isCaptain = await tripService.isCaptain(tripId, session!.user!.id!);
  if (expense.payerId !== session!.user!.id! && !isCaptain) {
    return errorResponse("Only the expense creator or captain can update", 403);
  }

  const parsed = await parseBody(request, updateExpenseSchema);
  if ("error" in parsed) return parsed.error;

  const updated = await expenseService.updateExpense(expenseId, parsed.data);
  if (!updated) return errorResponse("No fields to update", 400);

  return NextResponse.json({ expense: updated });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { tripId, expenseId } = await params;
  const member = await tripService.isTripMember(tripId, session!.user!.id!);
  if (!member) return errorResponse("Not a member of this trip", 403);

  const expense = await expenseService.getExpense(expenseId);
  if (!expense) return errorResponse("Expense not found", 404);
  if (expense.tripId !== tripId) return errorResponse("Expense not found", 404);

  // Only the creator or captain can delete
  const isCaptain = await tripService.isCaptain(tripId, session!.user!.id!);
  if (expense.payerId !== session!.user!.id! && !isCaptain) {
    return errorResponse("Only the expense creator or captain can delete", 403);
  }

  const deleted = await expenseService.deleteExpense(expenseId);
  if (!deleted) return errorResponse("Expense not found", 404);

  return NextResponse.json({ success: true });
}
