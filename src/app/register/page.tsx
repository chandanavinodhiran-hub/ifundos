"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Hexagon, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    organizationName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          organizationName: form.organizationName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
      } else {
        router.push("/login?registered=true");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "flex h-12 w-full rounded-xl border-0 bg-neu-dark/50 shadow-neu-inset px-3 py-2 text-sm text-sovereign-charcoal placeholder:text-sovereign-stone/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sovereign-gold/40 transition-all";

  return (
    <div className="login-shell min-h-screen flex items-center justify-center bg-neu-base px-4 relative overflow-hidden">
      {/* Soft neumorphic background texture */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: "radial-gradient(circle at 50% 50%, rgba(184,148,63,0.08) 0%, transparent 60%)",
      }} />
      {/* Top-right glow */}
      <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-neu-light rounded-full blur-3xl opacity-60" />
      {/* Bottom-left shadow */}
      <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-neu-darker rounded-full blur-3xl opacity-40" />

      <div className="w-full max-w-md relative z-10 py-8">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-neu-raised-lg"
            style={{
              background: "linear-gradient(135deg, #b8943f 0%, #d4b665 60%, #b8943f 100%)",
            }}
          >
            <Hexagon className="w-8 h-8 text-sovereign-charcoal" />
          </div>
          <h1 className="text-3xl font-display font-bold text-sovereign-charcoal tracking-tight mt-4">
            iFundOS
          </h1>
          <p className="text-sovereign-gold text-sm font-medium mt-1">
            Contractor Registration
          </p>
        </div>

        {/* Neumorphic form card */}
        <div className="rounded-[18px] bg-neu-base shadow-neu-raised-lg p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-sovereign-charcoal">Create Account</h2>
            <p className="text-sm text-sovereign-stone mt-1">
              Register your organization to apply for funding
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-critical/10 border border-critical/20 text-critical px-4 py-3 text-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-critical shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sovereign-charcoal font-medium text-sm">Full Name</Label>
              <input
                id="name"
                placeholder="Your full name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sovereign-charcoal font-medium text-sm">Email</Label>
              <input
                id="email"
                type="email"
                placeholder="you@organization.sa"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgName" className="text-sovereign-charcoal font-medium text-sm">Organization Name</Label>
              <input
                id="orgName"
                placeholder="Your company or entity name"
                value={form.organizationName}
                onChange={(e) => updateField("organizationName", e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sovereign-charcoal font-medium text-sm">Password</Label>
              <input
                id="password"
                type="password"
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sovereign-charcoal font-medium text-sm">Confirm Password</Label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-neu-raised-sm neu-press cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sovereign-charcoal mt-2"
              style={{
                background: "linear-gradient(135deg, #b8943f 0%, #d4b665 60%, #b8943f 100%)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Register"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neu-darker/50" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-neu-base px-3 text-sovereign-stone">Already have an account?</span>
              </div>
            </div>
            <Link
              href="/login"
              className="inline-block mt-3 text-sm text-sovereign-gold hover:text-sovereign-gold/80 font-medium transition-colors"
            >
              Sign in &rarr;
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-sovereign-stone mt-8">
          Powered by <span className="font-semibold text-sovereign-gold">Iozera Technologies</span>
        </p>
      </div>
    </div>
  );
}
