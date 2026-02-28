"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Mail, Lock, LogIn, Loader2, Hexagon } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        if (callbackUrl) {
          router.push(callbackUrl);
        } else {
          const res = await fetch("/api/auth/session");
          const session = await res.json();
          const role = session?.user?.role;
          switch (role) {
            case "CONTRACTOR":
              router.push("/contractor");
              break;
            case "FUND_MANAGER":
              router.push("/dashboard");
              break;
            case "ADMIN":
              router.push("/admin");
              break;
            case "AUDITOR":
              router.push("/audit");
              break;
            default:
              router.push("/");
          }
        }
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell min-h-screen flex flex-col items-center justify-center bg-neu-base px-4 relative overflow-hidden">
      {/* Soft neumorphic background texture */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: "radial-gradient(circle at 50% 50%, rgba(184,148,63,0.08) 0%, transparent 60%)",
      }} />
      {/* Top-left glow */}
      <div className="absolute -top-20 -left-20 w-[400px] h-[400px] bg-neu-light rounded-full blur-3xl opacity-60" />
      {/* Bottom-right shadow */}
      <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-neu-darker rounded-full blur-3xl opacity-40" />

      <div className="w-full max-w-md relative z-10">
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
            Intelligent Fund Operating System
          </p>
          <p className="text-sovereign-stone text-xs mt-1">
            Saudi Green Initiative
          </p>
        </div>

        {/* Neumorphic form card */}
        <div className="rounded-[18px] bg-neu-base shadow-neu-raised-lg p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-sovereign-charcoal">Welcome Back</h2>
            <p className="text-sm text-sovereign-stone mt-1">
              Sign in to access your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl bg-critical/10 border border-critical/20 text-critical px-4 py-3 text-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-critical shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sovereign-charcoal font-medium text-sm">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sovereign-stone" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@organization.sa"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex h-12 w-full rounded-xl border-0 bg-neu-dark/50 shadow-neu-inset pl-10 pr-3 py-2 text-sm text-sovereign-charcoal placeholder:text-sovereign-stone/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sovereign-gold/40 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sovereign-charcoal font-medium text-sm">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sovereign-stone" />
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="flex h-12 w-full rounded-xl border-0 bg-neu-dark/50 shadow-neu-inset pl-10 pr-3 py-2 text-sm text-sovereign-charcoal placeholder:text-sovereign-stone/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sovereign-gold/40 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-neu-raised-sm neu-press cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sovereign-charcoal"
              style={{
                background: "linear-gradient(135deg, #b8943f 0%, #d4b665 60%, #b8943f 100%)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neu-darker/50" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-neu-base px-3 text-sovereign-stone">New contractor?</span>
              </div>
            </div>
            <Link
              href="/register"
              className="inline-block mt-3 text-sm text-sovereign-gold hover:text-sovereign-gold/80 font-medium transition-colors"
            >
              Register your organization &rarr;
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
