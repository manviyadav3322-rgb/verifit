"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button, Card } from "@/components/ui/primitives";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    if (password.length < 8) { setError("Use at least 8 characters for the password."); return; }
    toast.success(isSignup ? "Demo profile details accepted" : "Demo sign-in accepted", { description: "Accounts are not connected in this frontend MVP." });
  }

  return (
    <main className="auth-page">
      <Card className="auth-card">
        <div className="auth-logo"><Brand /></div>
        <h1>{isSignup ? "Create your profile" : "Welcome back"}</h1>
        <p>{isSignup ? "Start with a profile. Your readiness view is built around evidence you can verify." : "Sign in to continue to your readiness workspace."}</p>
        <form onSubmit={handleSubmit} className="auth-fields" noValidate>
          {isSignup ? <div className="form-field"><label htmlFor="name">Full name</label><input id="name" name="name" autoComplete="name" required defaultValue="Manvi Yadav" /></div> : null}
          <div className="form-field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" placeholder="you@college.edu" required /></div>
          <div className="form-field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} placeholder="At least 8 characters" required minLength={8} /></div>
          {error ? <p role="alert" style={{ margin: 0, color: "var(--red)", fontSize: 11 }}>{error}</p> : null}
          <Button type="submit" style={{ width: "100%", marginTop: 3 }}>{isSignup ? "Create demo profile" : "Sign in"}<ArrowRight size={14} /></Button>
        </form>
        <div className="auth-foot">{isSignup ? "Already have a profile? " : "New to VeriFit? "}<Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create an account"}</Link></div>
        <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid var(--border)", color: "var(--muted)", fontSize: 10, textAlign: "center" }}>Demo only — no account or password is stored.</div>
        <div style={{ marginTop: 15, textAlign: "center" }}><Link href="/" style={{ color: "var(--muted)", textDecoration: "none", fontSize: 11 }}><ArrowLeft size={12} style={{ verticalAlign: "middle" }} /> Back to VeriFit</Link></div>
      </Card>
    </main>
  );
}
