"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button, Card } from "@/components/ui/primitives";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const messages: Record<string, string> = {
      auth_failed: "Manus returned to VeriFit, but sign-in could not be completed. Please try again.",
      auth_unavailable: "Manus sign-in is not configured for this Preview. Contact the site owner.",
      token_exchange_failed: "Manus could not validate the sign-in response. Please try again.",
      identity_lookup_failed: "Your Manus identity could not be verified. Please try again.",
      account_setup_failed: "Your VeriFit account could not be loaded. Please try again or contact an administrator.",
      account_disabled: "This VeriFit account is disabled. Ask an administrator to restore access.",
      session_setup_failed: "A secure session could not be created. Please try again.",
    };
    const code = new URLSearchParams(window.location.search).get("error");
    if (code && messages[code]) setError(messages[code]);
  }, []);

  async function continueWithManus() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/start", { method: "POST", headers: { "X-VeriFit-Origin": window.location.origin }, cache: "no-store" });
      const result = await response.json() as { authorizationUrl?: string; error?: string };
      if (!response.ok || !result.authorizationUrl) throw new Error(result.error ?? "Sign-in could not start.");
      window.location.assign(result.authorizationUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign-in could not start. Try again.");
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <Card className="auth-card">
        <div className="auth-logo"><Brand /></div>
        <h1>{isSignup ? "Create your profile" : "Welcome back"}</h1>
        <p>{isSignup ? "Use your Manus account to create a private, evidence-based readiness workspace." : "Sign in with your Manus account to continue to your readiness workspace."}</p>
        {error ? <p role="alert" style={{ margin: "14px 0 0", color: "var(--red)", fontSize: 11 }}>{error}</p> : null}
        <Button type="button" disabled={busy} onClick={continueWithManus} style={{ width: "100%", marginTop: 22 }}>
          {busy ? <LoaderCircle size={14} className="spin" /> : null}{busy ? "Connecting…" : "Continue with Manus"}<ArrowRight size={14} />
        </Button>
        <div className="auth-foot">{isSignup ? "Already have an account? " : "New to VeriFit? "}<Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create an account"}</Link></div>
        <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid var(--border)", color: "var(--muted)", fontSize: 10, textAlign: "center" }}>Your account and profile are stored securely in this VeriFit workspace.</div>
        <div style={{ marginTop: 15, textAlign: "center" }}><Link href="/" style={{ color: "var(--muted)", textDecoration: "none", fontSize: 11 }}><ArrowLeft size={12} style={{ verticalAlign: "middle" }} /> Back to VeriFit</Link></div>
      </Card>
    </main>
  );
}
