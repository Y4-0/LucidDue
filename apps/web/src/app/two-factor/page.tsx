"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function TwoFactorPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code,
      });

      if (result.error) {
        setError(result.error.message || "Invalid code");
        setIsLoading(false);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Network error.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-pearl items-center justify-center p-8">
      <div className="w-full max-w-[400px] bg-white p-8 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.02)]">
        <h1 className="text-3xl font-serif text-onyx mb-2">Two-Factor Auth</h1>
        <p className="text-stone text-sm mb-8">
          Enter the 6-digit code from your authenticator app.
        </p>

        {error && <div className="mb-4 text-sm text-crimson bg-rose/50 p-3 rounded border border-rose">{error}</div>}

        <form onSubmit={handleVerify} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="code" className="text-sm font-medium text-onyx">
              Authentication Code
            </label>
            <input
              id="code"
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\\D/g, ''))}
              className="w-full px-4 py-3 border border-oatmeal rounded-lg outline-none transition-colors focus:border-forest text-onyx placeholder:text-stone/50 bg-transparent text-center tracking-[0.5em] font-mono text-lg"
              placeholder="000000"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full bg-forest hover:bg-forest-dark disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-colors mt-2 cursor-pointer"
          >
            {isLoading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
}
