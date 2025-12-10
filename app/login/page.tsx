"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const {
    user,
    loading: authLoading,
    loginWithGoogle,
    signupWithEmail,
    loginWithEmail,
  } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Redirect in an effect, not during render
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/projects");
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) return;

    setSubmitting(true);
    try {
      if (mode === "login") {
        await loginWithEmail(email.trim(), password);
      } else {
        await signupWithEmail(email.trim(), password);
      }
      router.push("/projects");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message || "Something went wrong. Please check your details."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await loginWithGoogle();
      router.push("/projects");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Google sign-in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-md">
        <h1 className="text-2xl font-semibold text-slate-900">
          {mode === "login" ? "Log in" : "Sign up"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {mode === "login"
            ? "Log in to manage your projects, milestones, and tasks."
            : "Create an account with your email to start tracking projects."}
        </p>

        {/* Toggle */}
        <div className="mt-4 flex rounded-lg bg-slate-100 p-1 text-xs">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-md px-3 py-2 ${
              mode === "login"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600"
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-md px-3 py-2 ${
              mode === "signup"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600"
            }`}
          >
            Sign up
          </button>
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              className="w-full rounded border px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="w-full rounded border px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
          </div>

          {error && (
            <p className="text-xs text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !email.trim() || !password.trim()}
            className="mt-1 w-full rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting
              ? mode === "login"
                ? "Logging in..."
                : "Creating account..."
              : mode === "login"
              ? "Log in with email"
              : "Sign up with email"}
          </button>
        </form>

        {/* Divider */}
        <div className="my-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs uppercase text-slate-400">or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Google button */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded border px-4 py-2 text-sm font-medium text-slate-800 disabled:opacity-50"
        >
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  );
}
