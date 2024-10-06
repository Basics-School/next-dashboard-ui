import { NextResponse } from "next/server";
import { auth } from "@/actions/auth";
export default auth((req) => {
  const url = req.nextUrl;
  const path = url.pathname;
  const session = req.auth;

  
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
