"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Better Auth client side session check
    authClient.getSession().then(({ data, error }) => {
       if (error || !data) {
          router.push("/login");
       } else {
          setSession(data);
       }
       setLoading(false);
    });
  }, [router]);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pearl flex items-center justify-center">
        <p className="text-stone">Loading session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pearl p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-serif text-onyx">LucidDue Dashboard</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 border border-stone/20 text-stone rounded-lg hover:bg-white hover:text-onyx transition-colors text-sm font-medium"
          >
            Sign Out
          </button>
        </header>

        <div className="bg-white p-8 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.02)] border border-oatmeal/50">
          <h2 className="text-xl font-medium text-onyx mb-6">Welcome back, {session?.user?.name || "User"}!</h2>
          
          <div className="flex flex-col gap-4">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 bg-sage rounded-full flex items-center justify-center text-forest text-xl font-medium">
                {session?.user?.name?.charAt(0).toUpperCase() || session?.user?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-onyx font-medium">{session?.user?.name}</p>
                <p className="text-stone text-sm">{session?.user?.email}</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-oatmeal">
              <h3 className="text-sm font-medium text-onyx uppercase tracking-wider mb-4">Security Overview</h3>
              <div className="bg-pearl/50 rounded-lg p-4 border border-oatmeal/50 flex justify-between items-center">
                <div>
                  <p className="font-medium text-onyx text-sm">Two-Factor Authentication</p>
                  <p className="text-xs text-stone mt-1">Add an extra layer of security to your account.</p>
                </div>
                <button 
                  className="px-3 py-1.5 bg-forest text-white text-xs font-medium rounded hover:bg-forest-dark transition-colors"
                  onClick={() => alert("2FA setup UI coming soon!")}
                >
                  Enable 2FA
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
