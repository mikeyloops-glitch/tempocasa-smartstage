import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isClerkConfigured } from "@/lib/auth";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/api/stage(.*)", "/api/projects(.*)"]);

const middleware = isClerkConfigured()
  ? clerkMiddleware(async (auth, request) => {
      if (isProtectedRoute(request)) {
        await auth.protect();
      }
    })
  : function demoMiddleware() {
      return NextResponse.next();
    };

export default middleware;

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"]
};
