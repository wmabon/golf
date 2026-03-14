import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { tripId } = await params;

  // Fetch trip data from API
  let trip = null;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/trips/${tripId}`, {
      headers: {
        cookie: `next-auth.session-token=${session}`,
      },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      trip = data.trip;
    }
  } catch {
    // Fallback: show basic layout
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-green-700">
            Trips
          </Link>
          <span>/</span>
          <span>{trip?.name || "Trip"}</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{trip?.name || "Trip Details"}</h1>
          {trip && (
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-800 uppercase">
              {trip.status}
            </span>
          )}
        </div>
        {trip && (
          <p className="text-gray-500 text-sm mt-1">
            {trip.dateStart} to {trip.dateEnd} &middot; {trip.golferCount} golfers &middot;{" "}
            {trip.anchorValue}
          </p>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Link
          href={`/trips/${tripId}/vote`}
          className="rounded-lg border border-gray-200 p-4 text-center hover:border-green-600 hover:bg-green-50 transition"
        >
          <div className="font-bold text-sm">Vote Board</div>
          <div className="text-xs text-gray-500">Pick your courses</div>
        </Link>
        <Link
          href={`/search`}
          className="rounded-lg border border-gray-200 p-4 text-center hover:border-green-600 hover:bg-green-50 transition"
        >
          <div className="font-bold text-sm">Find Courses</div>
          <div className="text-xs text-gray-500">Discover options</div>
        </Link>
        <div className="rounded-lg border border-gray-200 p-4 text-center text-gray-400">
          <div className="font-bold text-sm">Itinerary</div>
          <div className="text-xs">Coming soon</div>
        </div>
        <div className="rounded-lg border border-gray-200 p-4 text-center text-gray-400">
          <div className="font-bold text-sm">Photos</div>
          <div className="text-xs">Coming soon</div>
        </div>
      </div>

      {/* Activity feed placeholder */}
      <div>
        <h2 className="font-bold text-lg mb-4">Activity</h2>
        <div className="rounded border border-gray-200 p-8 text-center text-gray-400">
          <p className="text-sm">
            No activity yet. Invite your crew and start planning.
          </p>
        </div>
      </div>
    </main>
  );
}
