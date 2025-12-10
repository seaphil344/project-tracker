// components/AppNav.tsx
"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AppNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
      {/* Left: logo / brand */}
      <div className="flex items-center gap-2">
        <span className="rounded bg-indigo-600 px-2 py-1 text-xs font-semibold text-white">
          PT
        </span>
        <Link
          href="/projects"
          className="text-sm font-semibold text-slate-900"
        >
          Project Tracker
        </Link>
      </div>

      {/* Right: links + auth */}
      <div className="flex items-center gap-4 text-sm">
        <Link
          href="/projects"
          className={`${
            isActive("/projects")
              ? "text-slate-900 font-medium"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Projects
        </Link>
        <Link
          href="/my-tasks"
          className={`${
            isActive("/my-tasks")
              ? "text-slate-900 font-medium"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          My Tasks
        </Link>

        {/* Auth section */}
        {loading ? (
          <span className="text-xs text-slate-500">Checking auth…</span>
        ) : user ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-500 sm:inline">
              {user.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Log in
          </Link>
        )}
      </div>
    </nav>
  );
}
