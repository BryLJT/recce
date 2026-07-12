import { NextRequest, NextResponse } from "next/server";

// Secret-link gate. The consultant sends: https://<host>/?k=<ACCESS_CODE>
// First visit with the right ?k sets a cookie; everything else (pages AND
// API routes) 401s without it. No ACCESS_CODE env var = gate disabled (local dev).

const COOKIE = "recce_clearance";

export function middleware(req: NextRequest) {
  const code = process.env.ACCESS_CODE;
  if (!code) return NextResponse.next(); // local dev: no gate

  // already cleared
  if (req.cookies.get(COOKIE)?.value === code) return NextResponse.next();

  // arriving via the secret link → set cookie, clean the URL
  const supplied = req.nextUrl.searchParams.get("k");
  if (supplied === code) {
    const clean = req.nextUrl.clone();
    clean.searchParams.delete("k");
    const res = NextResponse.redirect(clean);
    res.cookies.set(COOKIE, code, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // one week
    });
    return res;
  }

  // no clearance
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "no clearance" }, { status: 401 });
  }
  return new NextResponse(
    `<!DOCTYPE html><html><head><title>Recce</title></head>
     <body style="font-family:monospace;background:#16180f;color:#d6dcc0;display:grid;place-items:center;height:100vh;margin:0">
       <div style="text-align:center">
         <p style="letter-spacing:.2em;font-size:12px;color:#e8590c">■ RECCE</p>
         <p style="letter-spacing:.14em;font-size:13px">RESTRICTED — ACCESS BY INVITATION LINK ONLY</p>
         <p style="letter-spacing:.14em;font-size:11px;color:#8b9270">ask your consultant for your link</p>
       </div>
     </body></html>`,
    { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export const config = {
  // protect everything except Next.js internals and static assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
