"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const result = await authClient.signIn.email({
        email,
        password,
    });
    
    if (result.error) {
        setError(result.error.message || "Failed to sign in");
        setIsLoading(false);
    } else {
        // Successful login, keep skeleton loader showing until redirect happens via router
        window.location.href = "/dashboard";
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authClient.signIn.social({
          provider: "google",
          callbackURL: "/dashboard"
      });
      if (result.error) {
          setError(result.error.message || "Failed to sign in with Google");
          setIsLoading(false);
      }
    } catch (err) {
      setError("Network error. Backend might not be running.");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-pearl p-8 flex flex-col items-center">
        <div className="w-full max-w-5xl">
          <div className="h-10 w-48 bg-oatmeal rounded-md animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 border border-rose bg-rose/10 rounded-xl p-6 h-48 animate-pulse flex flex-col gap-4">
              <div className="h-6 w-32 bg-crimson/20 rounded" />
              <div className="h-12 w-24 bg-crimson/20 rounded mt-auto" />
            </div>
            <div className="col-span-1 border border-oatmeal bg-white rounded-xl p-6 h-48 animate-pulse flex flex-col gap-4">
              <div className="h-6 w-32 bg-oatmeal rounded" />
              <div className="h-12 w-24 bg-oatmeal rounded mt-auto" />
            </div>
            <div className="col-span-1 border border-oatmeal bg-white rounded-xl p-6 h-48 animate-pulse flex flex-col gap-4">
              <div className="h-6 w-32 bg-oatmeal rounded" />
              <div className="h-12 w-24 bg-oatmeal rounded mt-auto" />
            </div>
          </div>
          <div className="mt-12 h-64 w-full bg-white border border-oatmeal rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-pearl">
      {/* Left Column (Functional Side) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8 relative z-10 shadow-[0_0_40px_rgba(0,0,0,0.02)]">
        <div className="w-full max-w-[400px]">
          <h1 className="text-4xl font-serif text-onyx mb-2">Welcome back</h1>
          <p className="text-stone text-sm mb-8">
            Manage your invoices and follow-ups.
          </p>

          <button 
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-oatmeal rounded-lg hover:bg-pearl transition-colors text-onyx font-medium cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center my-8">
            <div className="flex-1 border-t border-oatmeal"></div>
            <span className="px-4 text-sm text-stone bg-white">or</span>
            <div className="flex-1 border-t border-oatmeal"></div>
          </div>

          {error && <div className="mb-4 text-sm text-crimson bg-rose/50 p-3 rounded border border-rose">{error}</div>}

          <form onSubmit={handleSignIn} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-onyx">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-oatmeal rounded-lg outline-none transition-colors focus:border-forest text-onyx placeholder:text-stone/50 bg-transparent"
                placeholder="you@agency.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-onyx">
                  Password
                </label>
                <Link href="/forgot-password" className="text-sm text-forest hover:text-forest-dark transition-colors font-medium">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-oatmeal rounded-lg outline-none transition-colors focus:border-forest text-onyx placeholder:text-stone/50 bg-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-forest hover:bg-forest-dark text-white font-medium py-3 px-4 rounded-lg transition-colors mt-2 cursor-pointer"
            >
              Sign In
            </button>
            
            <p className="text-center text-sm text-stone mt-2">
              Don't have an account?{" "}
              <Link href="/register" className="text-forest hover:text-forest-dark font-medium transition-colors">
                Register now
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Right Column (Vibe Side - Desktop Only) */}
      <div className="hidden lg:flex w-1/2 bg-[#2E3A32] relative flex-col items-center justify-center p-12 overflow-hidden">
        
        {/* Abstract Grid and Binary Background aligned to the palette */}
        <div 
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, #EFECE6 1px, transparent 1px),
              linear-gradient(to bottom, #EFECE6 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        ></div>

        {/* Scattered small binary text */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10 font-mono text-[10px] text-pearl font-bold leading-tight select-none flex flex-wrap gap-x-2 gap-y-1 p-4" aria-hidden="true">
            {mounted && Array.from({ length: 400 }).map((_, i) => (
                <span key={i} className={Math.random() > 0.8 ? 'opacity-100 text-[#4CAF50]' : 'opacity-40'}>
                    {Math.random() > 0.5 ? '1' : '0'}{Math.random() > 0.5 ? '1' : '0'}{Math.random() > 0.5 ? '1' : '0'}{Math.random() > 0.5 ? '1' : '0'}
                </span>
            ))}
        </div>

        {/* Subtle radial glow */}
        <div className="absolute inset-0 bg-radial-[at_center_center] from-transparent to-[#2E3A32] pointer-events-none" />
        
        <div className="relative z-10 max-w-lg text-center bg-[#2E3A32]/40 p-8 rounded-2xl backdrop-blur-sm border border-pearl/10 shadow-2xl">
          <h2 className="text-5xl md:text-6xl font-serif text-pearl leading-[1.15] tracking-tight">
            Your work is done.<br/>Let’s get you paid.
          </h2>
        </div>
      </div>
    </div>
  );
}
