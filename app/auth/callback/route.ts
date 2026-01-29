import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Auth callback handler for both Magic Link and OAuth flows.
 * 
 * When a user clicks a magic link or completes Google OAuth,
 * Supabase redirects them here with a code parameter.
 * We exchange that code for a session, then redirect to the app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  
  // The code is provided by Supabase after successful auth
  const code = searchParams.get("code");
  
  // Optional: where to redirect after login (default to home)
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Success! Redirect to the app
      // Use 307 for temporary redirect that preserves the request method
      return NextResponse.redirect(`${origin}${next}`);
    }
    
    // If there's an error, log it and redirect to login with error
    console.error("Auth callback error:", error.message);
  }

  // Something went wrong - redirect to login page with error message
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
