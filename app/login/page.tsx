"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/projects");
    }
  }, [user, loading, router]);

  const handleLogin = async () => {
    await signInWithGoogle();
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <p className="max-w-md text-center text-sm text-slate-600">
        Sign in to access your projects, milestones, and tasks.
      </p>
      {loading ? (
        <p className="text-sm text-slate-600">Checking session…</p>
      ) : (
        <button
          onClick={handleLogin}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Continue with Google
        </button>
      )}
    </div>
  );
}
