import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemedToaster } from "@/components/themed-toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "VeriFit — Readiness, backed by evidence", template: "%s · VeriFit" },
  description: "Understand your job readiness through transparent eligibility checks, evidence-backed requirements, and verifiable next steps.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="verifit-theme">
          {children}
          <ThemedToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
