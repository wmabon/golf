import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600">
            Name
          </label>
          <p className="text-lg">{session.user?.name}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Email
          </label>
          <p className="text-lg">{session.user?.email}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="rounded-xl bg-green-50 p-4 text-center">
            <p className="text-2xl font-bold text-green-900">0</p>
            <p className="text-xs text-green-700">Trips</p>
          </div>
          <div className="rounded-xl bg-green-50 p-4 text-center">
            <p className="text-2xl font-bold text-green-900">0</p>
            <p className="text-xs text-green-700">Rounds</p>
          </div>
          <div className="rounded-xl bg-green-50 p-4 text-center">
            <p className="text-2xl font-bold text-green-900">0</p>
            <p className="text-xs text-green-700">Bets settled</p>
          </div>
        </div>
        <p className="text-sm text-gray-400 pt-4">Editing and preferences are next. For now, here&apos;s what we&apos;ve got.</p>
      </div>
    </main>
  );
}
