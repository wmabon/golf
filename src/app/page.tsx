import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-green-800 text-white py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-extrabold tracking-tight mb-4 md:text-6xl">
            Turn your group chat into a golf trip.
          </h1>
          <p className="text-xl text-green-200 mb-10">
            Plan it. Book it. Play it. Brag about it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="rounded-lg bg-white text-green-800 px-8 py-3 text-lg font-bold hover:bg-green-100 transition"
            >
              Start a Trip
            </Link>
            <Link
              href="/login"
              className="rounded-lg border-2 border-white text-white px-8 py-3 text-lg font-bold hover:bg-white/10 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Four steps. Zero logistics headaches.
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                step: "1",
                title: "Rally the crew",
                desc: "Invite 2-8 golfers, set dates, pick a destination. Everyone gets a vote.",
              },
              {
                step: "2",
                title: "Find the goods",
                desc: "Discover courses by location, access, and budget. We filter out the ones you can't actually play.",
              },
              {
                step: "3",
                title: "Lock it in",
                desc: "Vote on options, book tee times, and let us handle the logistics. No more phone tag with pro shops.",
              },
              {
                step: "4",
                title: "Play and remember",
                desc: "Score rounds, settle bets, upload photos, and publish the recap. Bragging rights included.",
              },
            ].map(({ step, title, desc }) => (
              <div
                key={step}
                className="flex gap-4 p-6 rounded-xl bg-gray-50"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center font-bold text-lg">
                  {step}
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{title}</h3>
                  <p className="text-gray-600 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="py-20 px-6 bg-green-900 text-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Not your average trip planner.
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Courses worth the trip",
                desc: "Quality scoring that actually means something. Not just star ratings from randos \u2014 real golfer reviews across six dimensions plus editorial picks.",
              },
              {
                title: "Booking that works",
                desc: "Our concierge team handles the phone calls and back-to-back tee times. You just pick the course and show up.",
              },
              {
                title: "The bet ledger",
                desc: "Side bets in seconds. Nassau, skins, pride bets, stupid bets. Track it all, settle up with one tap. No more \"I'll Venmo you later.\"",
              },
            ].map(({ title, desc }) => (
              <div key={title} className="p-6 rounded-xl bg-green-800/50">
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-green-200 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-900 text-gray-400 text-center text-sm">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-bold text-white">Golf Trip</p>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-white transition">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-white transition">
              Create Account
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
