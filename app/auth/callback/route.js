// Google redirects here after login. We exchange the authorization code for a
// session (PKCE) and then send the student back where they started.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong (expired/invalid code) — bounce home with a flag.
  return NextResponse.redirect(`${origin}/?auth_error=1`);
}
