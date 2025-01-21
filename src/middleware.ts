import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server';

export default clerkMiddleware((auth,req) => {
    const  {userId}:any  = auth();
    const currentURL = new URL(req.url);
    const isAccessingDashboard = currentURL.pathname === "/home" || "/"
    const isAccessingApiPath = currentURL.pathname.startsWith("/api")

    // if user is already signed in and trying to access public URL then redirect to dashboard
    if (userId && isPublicRoute(req) && !isAccessingDashboard) {
        return NextResponse.redirect(new URL("/home", req.url));
    }

    // not logged in and trying to access the api part
    if (!userId && !isPublicApiRoute(req) && isAccessingApiPath) {
        return NextResponse.redirect(new URL("/signin", req.url));
    }

    // not logged in and trying to access the private path
    if (!userId && !isPublicRoute(req) && !isPublicApiRoute(req)) {
        return NextResponse.redirect(new URL("/signin", req.url));
    }

    return NextResponse.next();
})

const isPublicRoute = createRouteMatcher([
    "/signup",
    "/signin",
    "/",
    "/home"
])

const isPublicApiRoute = createRouteMatcher([
    "/api/videos",
])
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}