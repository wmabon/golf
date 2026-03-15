"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/booking-ops", label: "Booking Ops" },
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/config", label: "Config" },
];

export function AdminNav({ userName }: { userName?: string | null }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <span className="font-bold text-sm">Golf Trip Admin</span>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
          className="p-1"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileOpen ? (
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

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-white flex flex-col
          transition-transform duration-200
          md:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-700">
          <Link
            href="/admin"
            className="font-bold text-base text-slate-100"
            onClick={() => setMobileOpen(false)}
          >
            Golf Trip Admin
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`
                block rounded px-3 py-2 text-sm font-medium transition
                ${
                  isActive(link.href)
                    ? "bg-slate-200 text-slate-900"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }
              `}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-slate-700 px-5 py-4">
          <p className="text-sm text-slate-300 mb-2 truncate">
            {userName || "Operator"}
          </p>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs text-slate-400 hover:text-white transition"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
