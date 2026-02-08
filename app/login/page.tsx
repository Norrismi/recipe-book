"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export const dynamic = 'force-dynamic';
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const supabase = createClient();

  /**
   * Handles magic link (passwordless) login.
   * User enters email → receives link → clicks to login.
   */
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Redirect here after clicking the magic link
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({
        type: "success",
        text: "Check your email! We sent you a magic link to sign in.",
      });
      setEmail("");
    }

    setLoading(false);
  };

  /**
   * Handles Google OAuth login.
   * Redirects to Google → user authorizes → redirects back with session.
   */
  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Redirect here after Google auth completes
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
    }
    // If successful, user is redirected to Google - no need to set loading to false
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)]">
      {/* Decorative background pattern */}
      <div 
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230D9488' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--muted)] rounded-full mb-4">
            <span className="text-3xl">🍳</span>
          </div>
          <h1 className="text-3xl font-display font-semibold text-[var(--foreground)]">
            Mom&apos;s Recipe Book
          </h1>
          <p className="text-[var(--muted-foreground)] mt-2">
            Your personal digital cookbook
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[var(--card)] rounded-2xl p-8 border border-[var(--border)]">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6 text-center">
            Welcome Back
          </h2>

          {/* Status Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-900/30 text-green-200 border border-green-700/50"
                  : "bg-red-900/30 text-red-200 border border-red-700/50"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Magic Link Form */}
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--muted-foreground)] mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-[var(--border)] rounded-lg 
                         bg-[var(--background)] text-[var(--foreground)] 
                         placeholder-[var(--muted-foreground)]
                         focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/50
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 px-4 bg-[var(--accent)] hover:bg-[var(--accent)]/90
                       text-white font-medium rounded-lg
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200
                       flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>✉️</span>
                  <span>Send Magic Link</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[var(--card)] text-[var(--muted-foreground)]">or continue with</span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 px-4 bg-[var(--card)] border border-[var(--border)]
                     hover:bg-[var(--muted)] text-[var(--foreground)] font-medium rounded-lg
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-200
                     flex items-center justify-center gap-3"
          >
            {/* Google Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Help text */}
          <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
            No password needed! We&apos;ll email you a secure link to sign in.
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-[var(--muted-foreground)]">
          Made with ❤️ for the family
        </p>
      </div>
    </div>
  );
}
