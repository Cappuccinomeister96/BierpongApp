import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Aktualisiert die Supabase-Session bei jedem Request und schützt die
 * Schiedsrichter-Routen:
 *  - Ohne gültige Session → Redirect auf /schiri/login.
 *  - Mit Session aber ohne AAL2 (MFA nicht abgeschlossen) → Redirect auf
 *    /schiri/login?step=mfa, damit der TOTP-Schritt direkt angezeigt wird.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isSchiriArea =
    pathname.startsWith("/schiri") && pathname !== "/schiri/login";

  // Nicht eingeloggt → Login
  if (isSchiriArea && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/schiri/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Eingeloggt, aber MFA noch ausstehend → Login mit step=mfa
  if (isSchiriArea && user) {
    const { data: aalData } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalData?.nextLevel === "aal2" && aalData?.currentLevel !== "aal2") {
      const url = request.nextUrl.clone();
      url.pathname = "/schiri/login";
      url.searchParams.set("redirect", pathname);
      url.searchParams.set("step", "mfa");
      return NextResponse.redirect(url);
    }
  }

  // Bereits vollständig eingeloggt → Login-Seite überspringen
  if (pathname === "/schiri/login" && user) {
    const { data: aalData } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (!aalData || aalData.nextLevel === aalData.currentLevel) {
      const url = request.nextUrl.clone();
      url.pathname = "/schiri";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/schiri/:path*"],
};
