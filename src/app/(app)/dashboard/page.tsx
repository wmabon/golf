import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const firstName = session.user?.name?.split(" ")[0] || "Golfer";

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            What&apos;s the play, {firstName}?
          </h1>
          <p className="text-gray-500 text-sm">
            Your trips, your crew, your call.
          </p>
        </div>
        <Link
          href="/trips/new"
          className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-600 transition"
        >
          Start a Trip
        </Link>
      </div>

      {/* Empty state — Social Energy mode */}
      <div className="rounded-xl bg-green-50 border border-green-200 p-12 text-center">
        <p className="text-2xl font-bold text-green-900 mb-2">
          No trips yet. Someone&apos;s gotta go first.
        </p>
        <p className="text-green-700 mb-6">
          Rally the crew, pick a destination, and stop talking about it in the group chat.
        </p>
        <Link
          href="/trips/new"
          className="inline-block rounded-lg bg-green-700 px-8 py-3 text-sm font-bold text-white hover:bg-green-600 transition"
        >
          Plan the trip already
        </Link>
      </div>
    </main>
  );
}
