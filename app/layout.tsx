// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import AppNav from "@/components/AppNav";

export const metadata: Metadata = {
  title: "Project Tracker",
  description: "A clean and modern project management dashboard.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <header className="border-b bg-white">
              {/* Client nav that reacts to auth state */}
              <AppNav />
            </header>

            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
