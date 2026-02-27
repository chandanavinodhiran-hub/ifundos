"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 px-4 relative overflow-hidden">
      {/* Dot grid pattern */}
      <div className="absolute inset-0" style={{
        backgroundImage: "radial-gradient(circle, rgba(148,163,184,0.08) 0.5px, transparent 0.5px)",
        backgroundSize: "24px 24px",
      }} />
      {/* Subtle glow accents */}
      <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 shadow-lg shadow-violet-500/20 mb-4">
            <Hexagon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">iFundOS</h1>
          <p className="text-violet-300 text-sm font-medium mt-1">
            Intelligent Fund Operating System
          </p>
          <p className="text-slate-500 text-xs mt-1">
            Saudi Green Initiative
          </p>
        </div>

        <Card className="shadow-2xl shadow-black/20 border-slate-700/50 bg-white">
          <CardContent className="pt-8 pb-8 px-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Welcome Back</h2>
              <p className="text-sm text-slate-500 mt-1">
                Sign in to access your dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    placeholder="you@organization.sa"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 focus-visible:border-violet-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 focus-visible:border-violet-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 text-white font-medium text-sm hover:from-violet-700 hover:to-violet-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 cursor-pointer"
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
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-400">New contractor?</span>
                </div>
              </div>
              <Link
                href="/register"
                className="inline-block mt-3 text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors"
              >
                Register your organization &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-8">
          Powered by <span className="font-semibold text-slate-400">Exzera</span> &mdash; A Joint Venture of Expand &amp; Iozera
        </p>
      </div>
    </div>
  );
}
