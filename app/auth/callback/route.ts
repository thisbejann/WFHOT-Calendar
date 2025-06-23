import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  // return the user to an error page with instructions
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  return NextResponse.redirect(`${siteUrl}/auth/auth-code-error`);
}
