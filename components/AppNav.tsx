// components/AppNav.tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function AppNav() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="flex items-center gap-4 text-sm">
      <a href="/projects" className="hover:underline">
        Projects
      </a>

      {loading ? (
        <span className="text-xs text-slate-500">Checking auth…</span>
      ) : user ? (
        <>
          <span className="text-xs text-slate-600">
            {user.displayName ?? user.email}
          </span>
          <button
            onClick={() => logout()}
            className="rounded border px-2 py-1 text-xs"
          >
            Log out
          </button>
        </>
      ) : (
        <a href="/login" className="rounded border px-3 py-1 text-xs">
          Log in
        </a>
      )}
    </nav>
  );
}
