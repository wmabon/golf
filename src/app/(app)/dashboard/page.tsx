import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Your Trips</h1>
          <p className="text-gray-500 text-sm">
            Welcome back, {session.user?.name}
          </p>
        </div>
        <Link
          href="/trips/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Trip
        </Link>
      </div>

      <div className="rounded border border-gray-200 p-8 text-center text-gray-500">
        <p className="text-lg mb-2">No trips yet</p>
        <p className="text-sm">Create your first golf trip to get started.</p>
      </div>
    </main>
  );
}
