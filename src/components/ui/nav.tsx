"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";

export function Nav({ userName }: { userName?: string | null }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-green-800 text-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="font-bold text-lg">
          Golf Trip
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm text-green-200 hover:text-white transition"
          >
            Trips
          </Link>
          <Link
            href="/search"
            className="text-sm text-green-200 hover:text-white transition"
          >
            Courses
          </Link>
          <Link
            href="/profile"
            className="text-sm text-green-200 hover:text-white transition"
          >
            Profile
          </Link>
          <div className="flex items-center gap-3 ml-4 pl-4 border-l border-green-700">
            <span className="text-sm">{userName || "Golfer"}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-xs bg-green-700 hover:bg-green-600 px-3 py-1 rounded transition"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-green-700 px-4 py-3 space-y-3">
          <Link
            href="/dashboard"
            className="block text-sm text-green-200 hover:text-white"
            onClick={() => setMenuOpen(false)}
          >
            Trips
          </Link>
          <Link
            href="/search"
            className="block text-sm text-green-200 hover:text-white"
            onClick={() => setMenuOpen(false)}
          >
            Courses
          </Link>
          <Link
            href="/profile"
            className="block text-sm text-green-200 hover:text-white"
            onClick={() => setMenuOpen(false)}
          >
            Profile
          </Link>
          <div className="pt-2 border-t border-green-700 flex items-center justify-between">
            <span className="text-sm">{userName || "Golfer"}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-xs bg-green-700 hover:bg-green-600 px-3 py-1 rounded"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
