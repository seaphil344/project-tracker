// app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import AppNav from "@/components/AppNav";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="mx-auto max-w-5xl p-6">
            <header className="mb-6 flex items-center justify-between">
              <a href="/" className="text-lg font-semibold">
                Project Tracker
              </a>
              <AppNav />
            </header>
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
